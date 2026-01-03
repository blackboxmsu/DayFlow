// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, signin, getMe, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { signupValidation, signinValidation, validate } = require('../middleware/validation');

router.post('/signup', signupValidation, validate, signup);
router.post('/signin', signinValidation, validate, signin);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmail);

module.exports = router;

