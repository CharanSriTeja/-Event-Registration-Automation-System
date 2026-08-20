const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { sendConfirmationEmail, sendRejectionEmail } = require('../utils/emailService');
const { sendWhatsAppMessage } = require('../utils/whatsappService');
const { triggerQRSendForEvent } = require('../utils/qrSendService');


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

const getEventStats = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    
    const [total, entered, confirmed] = await Promise.all([
      prisma.registration.count({ where: { eventId } }),
      prisma.registration.count({ where: { eventId, entered: true } }),
      prisma.registration.count({ where: { eventId, paymentStatus: 'confirmed' } })
    ]);

    res.status(200).json({ total, entered, confirmed });
  } catch (error) {
    next(error);
  }
};

const getAllRegistrations = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { search, branch } = req.query;

    const where = { eventId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registrationId: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (branch) {
      where.branch = { contains: branch, mode: 'insensitive' };
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { registeredAt: 'desc' }
    });

    res.status(200).json(registrations);
  } catch (error) {
    next(error);
  }
};


const triggerQRSend = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const result = await triggerQRSendForEvent(eventId);
    res.status(200).json({ message: 'QR codes triggered successfully', result });
  } catch (error) {
    next(error);
  }
};

const scheduleQRSend = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { timing, customDateTime, rateLimitPerMin, limitCount } = req.body;
    
    // Ensure event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    let scheduledAt;
    if (timing === 'now') {
      scheduledAt = new Date();
    } else if (timing === '1hr') {
      scheduledAt = new Date(Date.now() + 60 * 60 * 1000);
    } else if (timing === '2hr') {
      scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    } else if (timing === 'custom' && customDateTime) {
      scheduledAt = new Date(customDateTime);
    } else {
      res.status(400);
      return next(new Error('Invalid timing parameter'));
    }

    // Count eligible students (confirmed payment + qrSent = false)
    const totalEligible = await prisma.registration.count({
      where: {
        eventId: eventId,
        paymentStatus: 'confirmed',
        qrSent: false
      }
    });

    // If limitCount is set, totalToSend is min(limitCount, totalEligible)
    let totalToSend = totalEligible;
    let actualLimitCount = null;
    if (limitCount !== undefined && limitCount !== null) {
      actualLimitCount = parseInt(limitCount, 10);
      if (actualLimitCount < totalEligible) {
        totalToSend = actualLimitCount;
      } else {
        actualLimitCount = null; // treat as send all
      }
    }

    const job = await prisma.qrSendJob.create({
      data: {
        eventId,
        scheduledAt,
        rateLimitPerMin: rateLimitPerMin || 10,
        totalToSend,
        limitCount: actualLimitCount,
        createdBy: req.admin?.username || 'admin',
        status: 'pending'
      }
    });

    res.status(201).json({
      message: 'Job scheduled successfully',
      job,
      totalEligible
    });
  } catch (error) {
    next(error);
  }
};

const getQrJobs = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const jobs = await prisma.qrSendJob.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

const createVolunteer = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if username already exists
    const existing = await prisma.volunteer.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const volunteer = await prisma.volunteer.create({
      data: { username, password: hashedPassword }
    });

    return res.status(201).json({
      message: 'Volunteer created',
      volunteer: { id: volunteer.id, username: volunteer.username, createdAt: volunteer.createdAt }
    });
  } catch (error) {
    next(error);
  }
};

const listVolunteers = async (req, res, next) => {
  try {
    const volunteers = await prisma.volunteer.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(volunteers);
  } catch (error) {
    next(error);
  }
};

const deleteVolunteer = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const volunteer = await prisma.volunteer.findUnique({ where: { id } });
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    await prisma.volunteer.delete({ where: { id } });
    return res.status(200).json({ message: 'Volunteer removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

