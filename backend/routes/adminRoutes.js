const express = require('express');
const {
  login,
  getPendingRegistrations,
  verifyRegistration,
  getEventStats,
  getAllRegistrations,
  triggerQRSend,
  scheduleQRSend,
  getQrJobs,
  createVolunteer,
  listVolunteers,
  deleteVolunteer
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { loginLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/login', loginLimiter, login);

// Protected routes — registrations
router.get('/registrations/:eventId/pending', adminAuth, getPendingRegistrations);
router.get('/registrations/:eventId/stats', adminAuth, getEventStats);
router.get('/registrations/:eventId', adminAuth, getAllRegistrations);
router.put('/registrations/:id/verify', adminAuth, verifyRegistration);

// QR Send endpoints
router.post('/events/:eventId/trigger-qr-send', adminAuth, triggerQRSend);
router.post('/events/:eventId/schedule-qr-send', adminAuth, scheduleQRSend);
router.get('/events/:eventId/qr-jobs', adminAuth, getQrJobs);

// Volunteer management
router.post('/volunteers', adminAuth, createVolunteer);
router.get('/volunteers', adminAuth, listVolunteers);
router.delete('/volunteers/:id', adminAuth, deleteVolunteer);

module.exports = router;
