const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.get('/', expenseController.list);
router.post('/', expenseController.create);
router.get('/:id', expenseController.getOne);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.remove);
router.post('/:id/receipt', upload.single('receipt'), expenseController.uploadReceipt);

module.exports = router;
