const express = require('express');
const { scanRegistration } = require('../controllers/scanController');
const volunteerAuth = require('../middleware/volunteerAuth');

const router = express.Router();

// POST /api/scan/:registrationId — accessible by volunteers and admins
router.post('/:registrationId', volunteerAuth, scanRegistration);

module.exports = router;
