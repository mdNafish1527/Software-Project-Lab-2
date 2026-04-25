// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/events', require('./routes/events'));
// app.use('/api/tickets', require('./routes/tickets'));
// app.use('/api/pricing', require('./routes/pricing'));
// app.use('/api/marketplace', require('./routes/marketplace'));
// app.use('/api/complaints', require('./routes/complaints'));

// // Health check
// app.get('/api/health', (req, res) => res.json({ status: 'GaanBajna API is running 🎵' }));

// // 404 fallback
// app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🎵 GaanBajna server running on port ${PORT}`));

// backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files: /uploads/image-name.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const eventRoutes = require('./routes/events');
const marketplaceRoutes = require('./routes/marketplace');
const pricingRoutes = require('./routes/pricing');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// If you create this file later:
// backend/routes/complaintQr.js
// then uncomment these two lines:
// const complaintQrRoutes = require('./routes/complaintQr');
// app.use('/api/complaint-qr', complaintQrRoutes);

// ─────────────────────────────────────────────
// Test Route
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('GaanBajna backend server is running');
});

// ─────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ─────────────────────────────────────────────
// Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
