const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.use(authenticate);

router.get('/profit-loss', reportController.profitLoss);
router.get('/balance-sheet', reportController.balanceSheet);
router.get('/tax-summary', reportController.taxSummary);
router.get('/dashboard-summary', reportController.dashboardSummary);

module.exports = router;
