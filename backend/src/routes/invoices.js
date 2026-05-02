const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

router.use(authenticate);

router.get('/', invoiceController.list);
router.post('/', invoiceController.create);
router.get('/:id', invoiceController.getOne);
router.put('/:id', invoiceController.update);
router.delete('/:id', invoiceController.remove);
router.post('/:id/send', invoiceController.send);
router.post('/:id/duplicate', invoiceController.duplicate);
router.patch('/:id/status', invoiceController.updateStatus);
router.get('/:id/pdf', invoiceController.generatePdf);

module.exports = router;
