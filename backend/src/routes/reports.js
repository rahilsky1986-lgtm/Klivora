const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.use(authenticate);

router.get('/profit-loss', reportController.profitLoss);
router.get('/balance-sheet', reportController.balanceSheet);
router.get('/tax-summary', reportController.taxSummary);
router.get('/dashboard-summary', reportController.dashboardSummary);
router.get('/trial-balance', reportController.trialBalance);
router.get('/general-ledger', reportController.generalLedger);
router.post('/bank-reconciliation', reportController.bankReconciliation);

module.exports = router;
