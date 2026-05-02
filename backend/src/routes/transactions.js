const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.use(authenticate);
router.get('/', transactionController.list);
router.post('/', transactionController.create);
router.delete('/:id', transactionController.remove);

module.exports = router;
