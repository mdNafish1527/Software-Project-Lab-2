const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticate } = require('../middleware/auth');

// Helper: consistent item SELECT columns
// Always returns: id, name, photo, type, description, price,
//                 stock_quantity, original_price, is_featured,
//                 condition_status, seller_name, seller_dept,
//                 seller_hall, seller_contact, tags
const ITEM_SELECT = `
  i.item_id        AS id,
  i.name,
  i.description,
  i.price,
  i.original_price,
  i.type,
  i.photo,
  i.stock_quantity,
  i.is_featured,
  i.is_available,
  i.condition_status,
  i.seller_name,
  i.seller_dept,
  i.seller_hall,
  i.seller_contact,
  i.tags,
  i.created_at,
  u.unique_username AS seller_username,
  u.profile_picture AS seller_pic
`;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      type, category, search,
      min_price, max_price, condition,
      page = 1, limit = 12, sort = 'newest',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where  = ['i.stock_quantity > 0'];
    let params = [];

    // FIX #2: accept both "type" and "category" params
    const typeFilter = type || category;
    if (typeFilter) { where.push('i.type = ?'); params.push(typeFilter); }

    if (search) {
      where.push('(i.name LIKE ? OR i.description LIKE ? OR i.type LIKE ? OR i.tags LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (min_price) { where.push('i.price >= ?'); params.push(Number(min_price)); }
    if (max_price) { where.push('i.price <= ?'); params.push(Number(max_price)); }
    if (condition) { where.push('i.condition_status = ?'); params.push(condition); }

    const whereClause = 'WHERE ' + where.join(' AND ');
    const orderMap = {
      newest:    'i.is_featured DESC, i.created_at DESC',
      oldest:    'i.created_at ASC',
      price_asc: 'i.price ASC',
      price_desc:'i.price DESC',
      featured:  'i.is_featured DESC, i.created_at DESC',
    };
    const orderClause = 'ORDER BY ' + (orderMap[sort] || orderMap.newest);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM ITEM i ${whereClause}`, params
    );

    const [items] = await db.query(
      `SELECT ${ITEM_SELECT}
       FROM ITEM i
       LEFT JOIN USER u ON i.seller_id = u.u_id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      items,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('GET /marketplace:', err);
    res.status(500).json({ message: 'Failed to load marketplace' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace/recommended
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recommended', async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT ${ITEM_SELECT}
       FROM ITEM i
       LEFT JOIN USER u ON i.seller_id = u.u_id
       WHERE i.stock_quantity > 0
       ORDER BY i.is_featured DESC, i.created_at DESC
       LIMIT 8`
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load recommendations' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX #1: POST /api/marketplace/order  — Place an order after payment
// ─────────────────────────────────────────────────────────────────────────────
router.post('/order', authenticate, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      items: orderItems,      // [{ item_id, quantity }]
      transaction_id,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_note,
    } = req.body;

    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: 'No items in order' });
    if (!shipping_name || !shipping_phone || !shipping_address)
      return res.status(400).json({ message: 'Delivery details are required' });

    // Calculate total & validate stock
    let total = 0;
    const resolved = [];
    for (const { item_id, quantity = 1 } of orderItems) {
      const [[item]] = await conn.query(
        'SELECT item_id, name, price, stock_quantity FROM ITEM WHERE item_id = ?',
        [item_id]
      );
      if (!item)
        throw new Error(`Item ${item_id} not found`);
      if (item.stock_quantity < quantity)
        throw new Error(`Not enough stock for "${item.name}"`);
      total += item.price * quantity;
      resolved.push({ ...item, quantity });
    }

    // Create ORDER row
    const [orderResult] = await conn.query(
      `INSERT INTO \`ORDER\`
         (buyer_id, total_amount, status, transaction_id,
          shipping_name, shipping_phone, shipping_address, shipping_note)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        req.user.u_id, total, transaction_id || null,
        shipping_name, shipping_phone, shipping_address, shipping_note || null,
      ]
    );
    const order_id = orderResult.insertId;

    // Create ORDER_ITEM rows and deduct stock
    for (const item of resolved) {
      await conn.query(
        'INSERT INTO ORDER_ITEM (order_id, item_id, quantity, price) VALUES (?,?,?,?)',
        [order_id, item.item_id, item.quantity, item.price]
      );
      await conn.query(
        'UPDATE ITEM SET stock_quantity = stock_quantity - ? WHERE item_id = ?',
        [item.quantity, item.item_id]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Order placed successfully!', order_id, total });

  } catch (err) {
    await conn.rollback();
    console.error('POST /marketplace/order:', err);
    res.status(500).json({ message: err.message || 'Failed to place order' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX #1: GET /api/marketplace/orders/mine  — User's order history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/orders/mine', authenticate, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT
         o.order_id        AS id,
         o.total_amount    AS total_price,
         o.status,
         o.transaction_id,
         o.shipping_name,
         o.shipping_phone,
         o.shipping_address,
         o.order_at,
         GROUP_CONCAT(i.name SEPARATOR ', ') AS item_name,
         SUM(oi.quantity)                    AS quantity
       FROM \`ORDER\` o
       JOIN ORDER_ITEM oi ON o.order_id = oi.order_id
       JOIN ITEM i        ON oi.item_id = i.item_id
       WHERE o.buyer_id = ?
       GROUP BY o.order_id
       ORDER BY o.order_at DESC`,
      [req.user.u_id]
    );
    res.json(orders);
  } catch (err) {
    console.error('GET /marketplace/orders/mine:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace/:id  — Item detail
// (must be AFTER /recommended and /orders/mine to avoid route conflicts)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${ITEM_SELECT}
       FROM ITEM i
       LEFT JOIN USER u ON i.seller_id = u.u_id
       WHERE i.item_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load item' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/marketplace  — Add new item
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, type, description, price, stock_quantity,
      photo, original_price, condition_status,
      seller_name, seller_dept, seller_hall, seller_contact,
    } = req.body;

    if (!name || !price || !type)
      return res.status(400).json({ message: 'name, price and type are required' });

    const [result] = await db.query(
      `INSERT INTO ITEM
         (seller_id, name, type, description, price, original_price,
          stock_quantity, photo, condition_status,
          seller_name, seller_dept, seller_hall, seller_contact)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.u_id, name, type, description || '', price,
        original_price || null, stock_quantity || 1, photo || '',
        condition_status || 'New',
        seller_name || null, seller_dept || null,
        seller_hall || null, seller_contact || null,
      ]
    );
    res.status(201).json({ message: 'Item listed successfully', item_id: result.insertId });
  } catch (err) {
    console.error('POST /marketplace:', err);
    res.status(500).json({ message: 'Failed to list item' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: PUT /api/marketplace/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ITEM WHERE item_id = ? AND seller_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found or not yours' });

    const { name, type, description, price, stock_quantity, photo } = req.body;
    await db.query(
      `UPDATE ITEM SET
         name           = COALESCE(?, name),
         type           = COALESCE(?, type),
         description    = COALESCE(?, description),
         price          = COALESCE(?, price),
         stock_quantity = COALESCE(?, stock_quantity),
         photo          = COALESCE(?, photo)
       WHERE item_id = ?`,
      [name, type, description, price, stock_quantity, photo, req.params.id]
    );
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: DELETE /api/marketplace/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ITEM WHERE item_id = ? AND seller_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found or not yours' });
    await db.query('UPDATE ITEM SET stock_quantity = 0 WHERE item_id = ?', [req.params.id]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

module.exports = router;
