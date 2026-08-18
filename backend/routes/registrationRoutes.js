const express = require('express');
const { body } = require('express-validator');
const { registerForEvent } = require('../controllers/registrationController');

const router = express.Router();

const upload = require('../config/multer');

// Validation middleware
const validateRegistration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('eventId').isInt().withMessage('Valid Event ID is required'),
];

router.post('/', upload.single('paymentScreenshot'), validateRegistration, registerForEvent);

module.exports = router;
