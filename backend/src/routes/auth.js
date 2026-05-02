const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh', authController.refreshToken);

module.exports = router;
