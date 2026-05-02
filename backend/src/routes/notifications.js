const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);
router.delete('/:id', notificationController.remove);

module.exports = router;
