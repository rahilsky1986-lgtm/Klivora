const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.use(authenticate);

router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.post('/me/logo', upload.single('logo'), userController.uploadLogo);
router.put('/me/onboarding', userController.completeOnboarding);
router.delete('/me', userController.deleteAccount);

module.exports = router;
