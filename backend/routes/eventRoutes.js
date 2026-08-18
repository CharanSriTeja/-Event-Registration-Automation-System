const express = require('express');
const { getEvents, createEvent, updateEvent } = require('../controllers/eventController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

const router = express.Router();

router.get('/', getEvents);
router.post('/', adminAuth, upload.single('coverImage'), createEvent);
router.put('/:id', adminAuth, upload.single('coverImage'), updateEvent);

module.exports = router;
