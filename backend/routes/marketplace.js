const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/marketplace - browse items
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, event_id } = req.query;
    let q = `
      SELECT i.*, u.unique_username as seller_name, e.title as event_title
      FROM ITEM i
      JOIN USER u ON i.seller_id = u.u_id
      LEFT JOIN EVENT e ON i.event_id = e.event_id
      WHERE i.stock_quantity > 0
    `;
    const params = [];
    if (search) { q += ' AND i.name LIKE ?'; params.push(`%${search}%`); }
    if (event_id) { q += ' AND i.event_id=?'; params.push(event_id); }
    q += ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(q, params);

    // Log browsing history
    for (const item of rows.slice(0, 5)) {
      await pool.query(
        'INSERT INTO BROWSING_HISTORY (u_id, item_id) VALUES (?,?)',
        [req.user.u_id, item.item_id]
      ).catch(() => {});
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/marketplace/recommended - recommended items
router.get('/recommended', authenticate, async (req, res) => {
  try {
    const [history] = await pool.query(
      'SELECT item_id FROM BROWSING_HISTORY WHERE u_id=? AND item_id IS NOT NULL GROUP BY item_id ORDER BY COUNT(*) DESC LIMIT 10',
      [req.user.u_id]
    );
    if (history.length === 0) {
      const [items] = await pool.query('SELECT * FROM ITEM WHERE stock_quantity>0 ORDER BY created_at DESC LIMIT 10');
      return res.json(items);
    }
    const itemIds = history.map(h => h.item_id);
    const [items] = await pool.query(
      `SELECT i.*, u.unique_username as seller_name FROM ITEM i JOIN USER u ON i.seller_id=u.u_id
       WHERE i.item_id IN (${itemIds.map(() => '?').join(',')}) AND i.stock_quantity>0`,
      itemIds
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/marketplace/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, u.unique_username as seller_name, e.title as event_title
      FROM ITEM i
      JOIN USER u ON i.seller_id = u.u_id
      LEFT JOIN EVENT e ON i.event_id = e.event_id
      WHERE i.item_id=?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Item not found' });

    // Track history
    await pool.query(
      'INSERT INTO BROWSING_HISTORY (u_id, item_id) VALUES (?,?)',
      [req.user.u_id, req.params.id]
    ).catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/marketplace - singer/organizer adds item
router.post('/', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const { event_id, name, type, description, price, stock_quantity, photo } = req.body;
    const [result] = await pool.query(
      'INSERT INTO ITEM (seller_id, event_id, name, type, description, price, stock_quantity, photo) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.u_id, event_id || null, name, type, description, price, stock_quantity, photo]
    );
    res.status(201).json({ message: 'Item added', item_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/marketplace/:id - update item
router.put('/:id', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const { name, type, description, price, stock_quantity, photo } = req.body;
    await pool.query(
      `UPDATE ITEM SET name=COALESCE(?,name), type=COALESCE(?,type), description=COALESCE(?,description),
       price=COALESCE(?,price), stock_quantity=COALESCE(?,stock_quantity), photo=COALESCE(?,photo)
       WHERE item_id=? AND seller_id=?`,
      [name, type, description, price, stock_quantity, photo, req.params.id, req.user.u_id]
    );
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/marketplace/:id
router.delete('/:id', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    await pool.query('DELETE FROM ITEM WHERE item_id=? AND seller_id=?', [req.params.id, req.user.u_id]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/marketplace/order - place order
router.post('/order', authenticate, async (req, res) => {
  try {
    const { items, shipping_name, shipping_address, shipping_phone } = req.body;
    // items = [{ item_id, quantity }]

    let total = 0;
    const lineItems = [];
    for (const item of items) {
      const [rows] = await pool.query('SELECT * FROM ITEM WHERE item_id=?', [item.item_id]);
      if (rows.length === 0 || rows[0].stock_quantity < item.quantity)
        return res.status(400).json({ message: `Item ${item.item_id} unavailable or insufficient stock` });
      total += rows[0].price * item.quantity;
      lineItems.push({ ...rows[0], quantity: item.quantity });
    }

    const shippingAmount = 60; // flat rate BDT 60
    const [orderResult] = await pool.query(
      'INSERT INTO `ORDER` (buyer_id, total_amount, shipping_amount, shipping_name, shipping_address, shipping_phone, status) VALUES (?,?,?,?,?,?,?)',
      [req.user.u_id, total + shippingAmount, shippingAmount, shipping_name, shipping_address, shipping_phone, 'paid']
    );
    const order_id = orderResult.insertId;

    for (const li of lineItems) {
      await pool.query(
        'INSERT INTO ORDER_ITEM (order_id, item_id, quantity, price) VALUES (?,?,?,?)',
        [order_id, li.item_id, li.quantity, li.price]
      );
      await pool.query(
        'UPDATE ITEM SET stock_quantity=stock_quantity-? WHERE item_id=?',
        [li.quantity, li.item_id]
      );
    }

    res.status(201).json({ message: 'Order placed!', order_id, total: total + shippingAmount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/marketplace/orders/mine
router.get('/orders/mine', authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM `ORDER` WHERE buyer_id=? ORDER BY order_at DESC',
      [req.user.u_id]
    );
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, i.name, i.photo FROM ORDER_ITEM oi JOIN ITEM i ON oi.item_id=i.item_id WHERE oi.order_id=?`,
        [order.order_id]
      );
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;