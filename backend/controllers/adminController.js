const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { sendConfirmationEmail, sendRejectionEmail } = require('../utils/emailService');
const { sendWhatsAppMessage } = require('../utils/whatsappService');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400);
      throw new Error('Please provide username and password');
    }

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { username: process.env.ADMIN_USERNAME, role: 'admin' },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.status(200).json({
        message: 'Admin logged in successfully',
        token,
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

const getPendingRegistrations = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        paymentStatus: 'pending'
      }
    });
    res.status(200).json(registrations);
  } catch (error) {
    next(error);
  }
};

const verifyRegistration = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action, reason } = req.body; // action can be 'confirm' or 'reject'
    const adminUsername = req.admin.username;

    // Find the registration first to get details for emails
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true } // Include event details for the email
    });

    if (!registration) {
      res.status(404);
      return next(new Error('Registration not found'));
    }

    let updatedRegistration;

    if (action === 'confirm') {
      updatedRegistration = await prisma.registration.update({
        where: { id },
        data: {
          paymentStatus: 'confirmed',
          verifiedAt: new Date(),
          verifiedBy: adminUsername
        }
      });

      // Trigger communication asynchronously (returns boolean, errors logged internally)
      sendConfirmationEmail(
        registration.email, 
        registration.name, 
        registration.registrationId, 
        registration.event.name
      );

      sendWhatsAppMessage(
        registration.phone, 
        `Hi ${registration.name}, your registration for ${registration.event.name} is confirmed!`
      ).catch(err => console.error("Failed to send whatsapp stub", err));

    } else if (action === 'reject') {
      updatedRegistration = await prisma.registration.update({
        where: { id },
        data: {
          paymentStatus: 'rejected',
          verifiedAt: new Date(),
          verifiedBy: adminUsername
        }
      });

      // Trigger rejection email asynchronously
      sendRejectionEmail(
        registration.email,
        registration.name,
        registration.event.name,
        reason
      );

    } else {
      res.status(400);
      return next(new Error('Invalid action. Must be "confirm" or "reject"'));
    }

    res.status(200).json({
      message: `Registration ${action}ed successfully`,
      registration: updatedRegistration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getPendingRegistrations,
  verifyRegistration
};
