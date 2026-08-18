const prisma = require('../config/prisma');
const generateRegistrationId = require('../utils/generateRegistrationId');
const { validationResult } = require('express-validator');

// @desc    Register for an event
// @route   POST /api/register
// @access  Public
const registerForEvent = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      return next(new Error(errors.array().map(e => e.msg).join(', ')));
    }

    const { name, email, phone, collegeId, eventId, year, branch } = req.body;
    const parsedEventId = parseInt(eventId, 10);

    // Handle payment screenshot
    let paymentScreenshotUrl = null;
    if (req.file) {
      paymentScreenshotUrl = `/uploads/${req.file.filename}`;
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parsedEventId }
    });

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    // Check capacity (optional, but good practice)
    const currentRegistrationsCount = await prisma.registration.count({
      where: { eventId: parsedEventId }
    });

    if (currentRegistrationsCount >= event.capacity) {
      res.status(400);
      return next(new Error('Event is already full'));
    }

    // Check if email or phone is already registered for this event
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: parsedEventId,
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingRegistration) {
      res.status(400);
      return next(new Error('This email or phone number is already registered for this event.'));
    }

    // Generate unique registration ID
    const registrationId = await generateRegistrationId(parsedEventId);

    // Create registration (paymentStatus defaults to "pending")
    const registration = await prisma.registration.create({
      data: {
        registrationId,
        name,
        email,
        phone,
        collegeId,
        year,
        branch,
        paymentScreenshot: paymentScreenshotUrl,
        eventId: parsedEventId
      }
    });

    res.status(201).json({
      message: 'Registration received! Confirmation email will be sent once payment is verified by admin.',
      registration
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent
};
