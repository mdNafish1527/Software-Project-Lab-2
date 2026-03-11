// ═══════════════════════════════════════════════════════════════════════════
//  FILE LOCATION: backend/routes/marketplace.js
//
//  ADD or REPLACE the GET routes at the top with these PUBLIC versions.
//  The POST/PUT/DELETE (order, add item) routes KEEP requiring auth.
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const db = require('../db');
// const { verifyToken, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace  — Browse all items (NO LOGIN REQUIRED)
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

    // Fetch distinct categories for filter panel
    const [cats] = await db.query(
      "SELECT DISTINCT category FROM marketplace_items WHERE is_available = 1 ORDER BY category"
    );

    res.json({
      items,
      categories: cats.map(c => c.category),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /marketplace error:', err);
    res.status(500).json({ message: 'Failed to load marketplace' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/marketplace/featured  — Featured items for homepage
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
// PUBLIC: GET /api/marketplace/recommended  — Recommended (PUBLIC fallback)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recommended', async (req, res) => {
  try {
    // If user is logged in, use browsing history (optional — check header)
    // Otherwise return featured/recent mix
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
// PUBLIC: GET /api/marketplace/:id  — Item detail (NO LOGIN REQUIRED)
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

    // Increment view count
    await db.query('UPDATE marketplace_items SET views = COALESCE(views, 0) + 1 WHERE id = ?', [req.params.id]);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load item' });
  }
});

// ─── YOUR EXISTING AUTH-PROTECTED ROUTES CONTINUE BELOW ───────────────────
// POST / (add item), PUT /:id, DELETE /:id, POST /order, GET /orders/mine
// Keep those routes with verifyToken middleware as they were.

module.exports = router;
