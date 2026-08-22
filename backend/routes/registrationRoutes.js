const express = require('express');
const { body } = require('express-validator');
const { registerForEvent } = require('../controllers/registrationController');

const router = express.Router();

const { uploadPayment } = require('../config/multer');

const { registerLimiter } = require('../middleware/rateLimiters');

// Validation middleware
const validateRegistration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\d{10}$/).withMessage('Mobile number must be exactly 10 digits'),
  body('eventId').isInt().withMessage('Valid Event ID is required'),
];

router.post('/', registerLimiter, uploadPayment.single('paymentScreenshot'), validateRegistration, registerForEvent);

module.exports = router;
