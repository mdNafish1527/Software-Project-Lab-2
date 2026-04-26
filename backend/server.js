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

// Body parser must come before routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const complaintQrRoutes = require('./routes/complaintQr');
const eventRoutes = require('./routes/events');
const pricingRoutes = require('./routes/pricing');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const invitationRoutes = require('./routes/invitations');
const marketplaceRoutes = require('./routes/marketplace');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaint-qr', complaintQrRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/market', marketplaceRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// ─────────────────────────────────────────────
// Health/Test Routes
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('GaanBajna backend server is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'GaanBajna API is running 🎵' });
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
