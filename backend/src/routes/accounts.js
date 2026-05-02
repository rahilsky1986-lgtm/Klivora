const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const accountController = require('../controllers/accountController');

router.use(authenticate);
router.get('/', accountController.list);
router.post('/', accountController.create);
router.put('/:id', accountController.update);
router.delete('/:id', accountController.remove);

module.exports = router;
