require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const payrollRoutes = require('./routes/payroll');

const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Logging ──────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:19006', // Expo web
    'exp://localhost:19000',  // Expo Go
  ],
  credentials: true,
}));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────
app.use('/api/', rateLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Klivora API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payroll', payrollRoutes);

app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// ── 404 Handler ──────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Klivora API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
