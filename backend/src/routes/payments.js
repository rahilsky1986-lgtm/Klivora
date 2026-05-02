const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.use('/webhook', express.raw({ type: 'application/json' }));
router.post('/webhook', paymentController.handleWebhook);

router.use(authenticate);
router.post('/create-payment-link', paymentController.createPaymentLink);
router.get('/history', paymentController.history);

module.exports = router;
