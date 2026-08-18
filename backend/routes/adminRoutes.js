const express = require('express');
const { login, getPendingRegistrations, verifyRegistration } = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', login);

// Protected routes
router.get('/registrations/:eventId/pending', adminAuth, getPendingRegistrations);
router.put('/registrations/:id/verify', adminAuth, verifyRegistration);

module.exports = router;
