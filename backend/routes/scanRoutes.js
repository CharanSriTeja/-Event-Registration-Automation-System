const express = require('express');
const { scanRegistration, getEventRegistrationsForVolunteer } = require('../controllers/scanController');
const volunteerAuth = require('../middleware/volunteerAuth');

const router = express.Router();

// GET /api/scan/events/:eventId/registrations — accessible by volunteers and admins
router.get('/events/:eventId/registrations', volunteerAuth, getEventRegistrationsForVolunteer);

// POST /api/scan/:registrationId — accessible by volunteers and admins
router.post('/:registrationId', volunteerAuth, scanRegistration);

module.exports = router;
