const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, min_price, max_price, condition: cond,
            page = 1, limit = 12, sort = 'newest', featured } = req.query;
    const offset = (page - 1) * limit;

    let where = ['m.is_available = 1'];
    let params = [];

    if (category) {
      where.push('m.category = ?');
      params.push(category);
    }
    if (search) {
      where.push('(m.title LIKE ? OR m.description LIKE ? OR m.tags LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (min_price) { where.push('m.price >= ?'); params.push(Number(min_price)); }
    if (max_price) { where.push('m.price <= ?'); params.push(Number(max_price)); }
    if (cond) { where.push('m.condition_status = ?'); params.push(cond); }
    if (featured === 'true') { where.push('m.is_featured = 1'); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const orderMap = {
      newest: 'm.created_at DESC',
      oldest: 'm.created_at ASC',
      price_asc: 'm.price ASC',
      price_desc: 'm.price DESC',
      featured: 'm.is_featured DESC, m.created_at DESC',
    };
    const orderClause = 'ORDER BY ' + (orderMap[sort] || orderMap.newest);

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM marketplace_items m ${whereClause}`, params
    );
    const total = countRows[0].total;

    const [items] = await db.query(
      `SELECT
        m.id, m.title, m.description, m.price, m.original_price, m.category,
        m.image_url, m.condition_status, m.seller_name, m.seller_dept,
        m.seller_hall, m.stock, m.is_featured, m.tags, m.created_at
      FROM marketplace_items m
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [cats] = await db.query(
      'SELECT DISTINCT category FROM marketplace_items WHERE is_available = 1 ORDER BY category'
    );

    res.json({
      items,
      categories: cats.map(c => c.category),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('GET /marketplace error:', err);
    res.status(500).json({ message: 'Failed to load marketplace' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace/featured
// ─────────────────────────────────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT id, title, price, original_price, category, image_url,
              condition_status, seller_name, seller_dept, is_featured
       FROM marketplace_items
       WHERE is_available = 1 AND is_featured = 1
       ORDER BY created_at DESC LIMIT 8`
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load featured items' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace/recommended
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recommended', async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT id, title, price, original_price, category, image_url,
              condition_status, seller_name, seller_dept
       FROM marketplace_items
       WHERE is_available = 1
       ORDER BY is_featured DESC, created_at DESC
       LIMIT 6`
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load recommendations' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        m.*,
        u.name AS seller_full_name, u.profile_pic AS seller_pic, u.bio AS seller_bio
       FROM marketplace_items m
       LEFT JOIN users u ON m.seller_id = u.id
       WHERE m.id = ? AND m.is_available = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });

    await db.query(
      'UPDATE marketplace_items SET views = COALESCE(views, 0) + 1 WHERE id = ?',
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load item' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/marketplace  — Add new item
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('singer', 'organizer'), async (req, res) => {
  try {
    const {
      title, description, price, original_price, category,
      image_url, condition_status, seller_contact, seller_hall,
      stock, tags,
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: 'title, price and category are required' });
    }

    const [userRows] = await db.query(
      'SELECT name, role FROM users WHERE id = ?', [req.user.id]
    );
    const seller = userRows[0];

    const [result] = await db.query(
      `INSERT INTO marketplace_items (
        title, description, price, original_price, category,
        image_url, condition_status, seller_id, seller_name,
        seller_contact, seller_hall, stock, tags,
        is_available, is_featured, views, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, NOW())`,
      [
        title, description || '', price, original_price || null, category,
        image_url || '', condition_status || 'Good',
        req.user.id, seller.name,
        seller_contact || '', seller_hall || '',
        stock || 1, tags || '',
      ]
    );

    res.status(201).json({ message: 'Item listed successfully', item_id: result.insertId });
  } catch (err) {
    console.error('POST /marketplace error:', err);
    res.status(500).json({ message: 'Failed to list item' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: PUT /api/marketplace/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM marketplace_items WHERE id = ? AND seller_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found or not yours' });

    const {
      title, description, price, original_price, category,
      image_url, condition_status, stock, tags, is_available,
    } = req.body;

    await db.query(
      `UPDATE marketplace_items SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        original_price = COALESCE(?, original_price),
        category = COALESCE(?, category),
        image_url = COALESCE(?, image_url),
        condition_status = COALESCE(?, condition_status),
        stock = COALESCE(?, stock),
        tags = COALESCE(?, tags),
        is_available = COALESCE(?, is_available)
       WHERE id = ?`,
      [
        title, description, price, original_price, category,
        image_url, condition_status, stock, tags, is_available,
        req.params.id,
      ]
    );

    res.json({ message: 'Item updated successfully' });
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
      'SELECT * FROM marketplace_items WHERE id = ? AND seller_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found or not yours' });

    await db.query(
      'UPDATE marketplace_items SET is_available = 0 WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Item removed from marketplace' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/marketplace/order
// ─────────────────────────────────────────────────────────────────────────────
router.post('/order', authenticate, async (req, res) => {
  try {
    const { item_id, quantity, shipping_address, phone } = req.body;

    if (!item_id || !shipping_address || !phone) {
      return res.status(400).json({ message: 'item_id, shipping_address and phone are required' });
    }

    const [itemRows] = await db.query(
      'SELECT * FROM marketplace_items WHERE id = ? AND is_available = 1',
      [item_id]
    );
    if (!itemRows.length) return res.status(404).json({ message: 'Item not found or unavailable' });

    const item = itemRows[0];
    const qty = quantity || 1;

    if (item.stock < qty) {
      return res.status(400).json({ message: `Only ${item.stock} in stock` });
    }

    const total_price = item.price * qty;

    const [result] = await db.query(
      `INSERT INTO orders (
        buyer_id, item_id, seller_id, quantity, total_price,
        shipping_address, phone, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [req.user.id, item_id, item.seller_id, qty, total_price, shipping_address, phone]
    );

    await db.query(
      'UPDATE marketplace_items SET stock = stock - ? WHERE id = ?',
      [qty, item_id]
    );

    await db.query(
      'UPDATE marketplace_items SET is_available = 0 WHERE id = ? AND stock <= 0',
      [item_id]
    );

    res.status(201).json({
      message: 'Order placed successfully',
      order_id: result.insertId,
      total_price,
    });
  } catch (err) {
    console.error('POST /marketplace/order error:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/marketplace/orders/mine
// ─────────────────────────────────────────────────────────────────────────────
router.get('/orders/mine', authenticate, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, m.title AS item_title, m.image_url,
              u.name AS seller_name
       FROM orders o
       JOIN marketplace_items m ON o.item_id = m.id
       JOIN users u ON o.seller_id = u.id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/marketplace/orders/selling
// ─────────────────────────────────────────────────────────────────────────────
router.get('/orders/selling', authenticate, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, m.title AS item_title, m.image_url,
              u.name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN marketplace_items m ON o.item_id = m.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load selling orders' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/marketplace/my-items
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-items', authenticate, async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT * FROM marketplace_items WHERE seller_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your items' });
  }
});

module.exports = router;
