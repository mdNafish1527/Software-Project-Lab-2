const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// PUBLIC: all active products
router.get('/products', async (req, res) => {
  try {
    const { event_id } = req.query;

    let sql = `
      SELECT 
        p.product_id,
        p.owner_id,
        p.event_id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image,
        p.is_active,
        p.created_at,
        u.unique_username AS owner_name,
        u.role AS owner_role,
        e.title AS event_title
      FROM \`MERCH_PRODUCT\` p
      JOIN \`USER\` u ON p.owner_id = u.u_id
      LEFT JOIN \`EVENT\` e ON p.event_id = e.event_id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (event_id) {
      sql += ` AND p.event_id = ?`;
      params.push(event_id);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /market/products:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Singer/Organizer: add product
router.post('/products', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const { event_id, name, description, price, stock, image } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: 'Product name and price are required' });
    }

    const ownerId = req.user.u_id;

    const [result] = await db.query(
      `INSERT INTO \`MERCH_PRODUCT\`
       (owner_id, event_id, name, description, price, stock, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ownerId,
        event_id || null,
        name,
        description || null,
        Number(price),
        Number(stock || 0),
        image || null,
      ]
    );

    res.status(201).json({
      message: 'Product added successfully',
      product_id: result.insertId,
    });
  } catch (err) {
    console.error('POST /market/products:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Singer/Organizer: own products
router.get('/my-products', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         p.*,
         e.title AS event_title
       FROM \`MERCH_PRODUCT\` p
       LEFT JOIN \`EVENT\` e ON p.event_id = e.event_id
       WHERE p.owner_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.u_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /market/my-products:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Singer/Organizer: update own product
router.put('/products/:productId', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { event_id, name, description, price, stock, image, is_active } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: 'Product name and price are required' });
    }

    const [result] = await db.query(
      `UPDATE \`MERCH_PRODUCT\`
       SET event_id = ?,
           name = ?,
           description = ?,
           price = ?,
           stock = ?,
           image = ?,
           is_active = ?
       WHERE product_id = ?
       AND owner_id = ?`,
      [
        event_id || null,
        name,
        description || null,
        Number(price),
        Number(stock || 0),
        image || null,
        is_active === false ? false : true,
        productId,
        req.user.u_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or not yours' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('PUT /market/products/:productId:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Singer/Organizer: delete/deactivate own product
router.delete('/products/:productId', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const { productId } = req.params;

    const [result] = await db.query(
      `UPDATE \`MERCH_PRODUCT\`
       SET is_active = FALSE
       WHERE product_id = ?
       AND owner_id = ?`,
      [productId, req.user.u_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or not yours' });
    }

    res.json({ message: 'Product removed from marketplace' });
  } catch (err) {
    console.error('DELETE /market/products/:productId:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// User: place product order
router.post('/orders', authenticate, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      product_id,
      quantity,
      delivery_name,
      delivery_phone,
      delivery_address,
      payment_method,
      transaction_id,
    } = req.body;

    if (!product_id || !quantity || !delivery_name || !delivery_phone || !delivery_address) {
      return res.status(400).json({
        message: 'Product, quantity, delivery name, phone and address are required',
      });
    }

    await conn.beginTransaction();

    const [products] = await conn.query(
      `SELECT product_id, owner_id, price, stock, is_active
       FROM \`MERCH_PRODUCT\`
       WHERE product_id = ?
       FOR UPDATE`,
      [product_id]
    );

    if (!products.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    const qty = Number(quantity);

    if (!product.is_active) {
      await conn.rollback();
      return res.status(400).json({ message: 'Product is not available' });
    }

    if (qty <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    if (product.stock < qty) {
      await conn.rollback();
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    if (product.owner_id === req.user.u_id) {
      await conn.rollback();
      return res.status(400).json({ message: 'You cannot order your own product' });
    }

    const totalPrice = Number(product.price) * qty;
    const method = payment_method || 'cod';
    const paymentStatus = method === 'cod' ? 'pending' : 'paid';

    const [orderResult] = await conn.query(
      `INSERT INTO \`PRODUCT_ORDER\`
       (product_id, buyer_id, seller_id, quantity, total_price,
        delivery_name, delivery_phone, delivery_address,
        payment_method, payment_status, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        req.user.u_id,
        product.owner_id,
        qty,
        totalPrice,
        delivery_name,
        delivery_phone,
        delivery_address,
        method,
        paymentStatus,
        transaction_id || null,
      ]
    );

    await conn.query(
      `UPDATE \`MERCH_PRODUCT\`
       SET stock = stock - ?
       WHERE product_id = ?`,
      [qty, product_id]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Order placed successfully',
      order_id: orderResult.insertId,
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /market/orders:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

// Buyer: my orders
router.get('/orders/my', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         o.*,
         p.name AS product_name,
         p.image AS product_image,
         seller.unique_username AS seller_name
       FROM \`PRODUCT_ORDER\` o
       JOIN \`MERCH_PRODUCT\` p ON o.product_id = p.product_id
       JOIN \`USER\` seller ON o.seller_id = seller.u_id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.u_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /market/orders/my:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Singer/Organizer: orders received
router.get('/orders/manage', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         o.*,
         p.name AS product_name,
         p.image AS product_image,
         buyer.unique_username AS buyer_name,
         buyer.email AS buyer_email
       FROM \`PRODUCT_ORDER\` o
       JOIN \`MERCH_PRODUCT\` p ON o.product_id = p.product_id
       JOIN \`USER\` buyer ON o.buyer_id = buyer.u_id
       WHERE o.seller_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.u_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /market/orders/manage:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Singer/Organizer: accept/reject/deliver order
router.put('/orders/:orderId/status', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    await conn.beginTransaction();

    const [orders] = await conn.query(
      `SELECT *
       FROM \`PRODUCT_ORDER\`
       WHERE order_id = ?
       AND seller_id = ?
       FOR UPDATE`,
      [orderId, req.user.u_id]
    );

    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Order not found or not yours' });
    }

    const order = orders[0];

    if (order.order_status !== 'pending' && status !== 'delivered') {
      await conn.rollback();
      return res.status(400).json({ message: 'This order has already been processed' });
    }

    await conn.query(
      `UPDATE \`PRODUCT_ORDER\`
       SET order_status = ?
       WHERE order_id = ?
       AND seller_id = ?`,
      [status, orderId, req.user.u_id]
    );

    if (status === 'rejected' && order.order_status !== 'rejected') {
      await conn.query(
        `UPDATE \`MERCH_PRODUCT\`
         SET stock = stock + ?
         WHERE product_id = ?`,
        [order.quantity, order.product_id]
      );
    }

    await conn.commit();

    res.json({ message: `Order ${status} successfully` });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /market/orders/:orderId/status:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
