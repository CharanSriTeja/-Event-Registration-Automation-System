const prisma = require('../config/prisma');

// Format a Date as "20 Aug 2026, 06:30 AM" using native JS (no external deps)
const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

const scanRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      res.status(400);
      return next(new Error('Registration ID is required'));
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

module.exports = { scanRegistration };
