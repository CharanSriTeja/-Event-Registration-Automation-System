const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

// Format a Date as "20 Aug 2026, 06:30 AM" using native JS (no external deps)
const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

const scanRegistration = async (req, res, next) => {
  try {
    const raw = req.params.registrationId;
    console.log('[Scan] Received registrationId param:', JSON.stringify(raw));

    if (!raw) {
      res.status(400);
      return next(new Error('Registration ID is required'));
    }

    // QR codes encode a signed JWT containing { registrationId }.
    // Decode it to recover the plain ID before the DB lookup.
    let registrationId;
    try {
      const secret = process.env.QR_SECRET || process.env.ADMIN_JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(raw, secret);
      registrationId = decoded.registrationId;
      console.log('[Scan] Decoded registrationId from JWT:', JSON.stringify(registrationId));
    } catch (jwtErr) {
      // Not a JWT (or invalid token) — treat the raw value as a plain ID
      console.log('[Scan] Not a valid JWT, using raw value as registrationId:', JSON.stringify(raw));
      registrationId = raw;
    }

    const registration = await prisma.registration.findUnique({
      where: { registrationId },
      include: { event: true }
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }

    if (registration.paymentStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Registration not confirmed (status: ${registration.paymentStatus})`
      });
    }

    if (registration.entered) {
      const scannedTime = registration.entryTimestamp
        ? formatDateTime(registration.entryTimestamp)
        : 'earlier';

      return res.status(409).json({
        success: false,
        message: `Already scanned at ${scannedTime}`
      });
    }

    // Mark as entered
    const updated = await prisma.registration.update({
      where: { registrationId },
      data: {
        entered: true,
        entryTimestamp: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Entry granted',
      name: registration.name,
      registrationId: registration.registrationId,
      eventName: registration.event.name,
      entryTimestamp: updated.entryTimestamp
    });
  } catch (error) {
    next(error);
  }
};

const getEventRegistrationsForVolunteer = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { search, branch } = req.query;

    const where = { eventId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registrationId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (branch) {
      where.branch = { contains: branch, mode: 'insensitive' };
    }

    const registrations = await prisma.registration.findMany({
      where,
      select: {
        id: true,
        registrationId: true,
        name: true,
        email: true,
        phone: true,
        branch: true,
        year: true,
        collegeId: true,
        paymentStatus: true,
        entered: true,
        registeredAt: true,
        entryTimestamp: true
      },
      orderBy: { registeredAt: 'desc' }
    });

    res.status(200).json(registrations);
  } catch (error) {
    next(error);
  }
};

module.exports = { scanRegistration, getEventRegistrationsForVolunteer };
