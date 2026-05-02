const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const customerController = require('../controllers/customerController');

router.use(authenticate);

router.get('/', customerController.list);
router.post('/', customerController.create);
router.get('/:id', customerController.getOne);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);
router.get('/:id/invoices', customerController.getInvoices);
router.get('/:id/balance', customerController.getBalance);

module.exports = router;
