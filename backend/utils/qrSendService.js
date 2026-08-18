const prisma = require('../config/prisma');
const { generateQRCode } = require('./qrGenerator');
const { sendQRCodeEmail } = require('./emailService');
const { sendWhatsAppMessage } = require('./whatsappService');

/**
 * Core function to send a QR code to a single registration.
 */
const sendQRToRegistration = async (registration, event) => {
  try {
    // 1. Generate QR Code
    const qrCodeUrl = await generateQRCode(registration.registrationId);
    if (!qrCodeUrl) {
      throw new Error(`Failed to generate QR code for ${registration.registrationId}`);
    }

    // 2. Send Email
    const emailSent = await sendQRCodeEmail(
      registration.email,
      registration.name,
      registration.registrationId,
      event.name,
      qrCodeUrl
    );

    if (!emailSent) {
      throw new Error(`Failed to send email to ${registration.email}`);
    }

    // 3. Send WhatsApp
    await sendWhatsAppMessage(
      registration.phone,
      "Your event is tomorrow! Check your email for your entry QR code."
    ).catch(e => console.error("WhatsApp stub failed", e)); // don't fail the whole process if WA fails

    // 4. Update DB
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        qrSent: true,
        qrCodeUrl: qrCodeUrl
      }
    });

    return true;
  } catch (error) {
    console.error(`[QR Send Service] Error for registration ${registration.id}:`, error);
    return false;
  }
};

/**
 * Unthrottled, immediate send for all eligible registrations in an event.
 * (Used for the manual demo/trigger endpoint)
 */
const triggerQRSendForEvent = async (eventId) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const registrations = await prisma.registration.findMany({
    where: {
      eventId: eventId,
      paymentStatus: 'confirmed',
      qrSent: false
    }
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const reg of registrations) {
    const success = await sendQRToRegistration(reg, event);
    if (success) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  return { total: registrations.length, sent: sentCount, failed: failedCount };
};

// Helper to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Rate-limited batch processing for a specific QrSendJob.
 */
const processQrSendJob = async (jobId) => {
  const job = await prisma.qrSendJob.findUnique({
    where: { id: jobId },
    include: { event: true }
  });

  if (!job) return;

  try {
    // Fetch eligible registrations ordered by registeredAt asc
    let registrations = await prisma.registration.findMany({
      where: {
        eventId: job.eventId,
        paymentStatus: 'confirmed',
        qrSent: false
      },
      orderBy: { registeredAt: 'asc' }
    });

    // Apply limitCount if set
    if (job.limitCount !== null && job.limitCount < registrations.length) {
      registrations = registrations.slice(0, job.limitCount);
    }

    // Update job to reflecting actual total to send
    await prisma.qrSendJob.update({
      where: { id: job.id },
      data: { totalToSend: registrations.length }
    });

    // Calculate delay between each send (e.g. 10/min -> 6000ms)
    const delayMs = job.rateLimitPerMin > 0 ? (60000 / job.rateLimitPerMin) : 0;

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      const success = await sendQRToRegistration(reg, job.event);

      if (success) sent++;
      else failed++;

      // Update progress in DB periodically or after each (doing after each for accuracy in admin UI)
      await prisma.qrSendJob.update({
        where: { id: job.id },
        data: { sentCount: sent, failedCount: failed }
      });

      // Pause before the next send, except for the last one
      if (i < registrations.length - 1 && delayMs > 0) {
        await sleep(delayMs);
      }
    }

    // Mark as completed
    await prisma.qrSendJob.update({
      where: { id: job.id },
      data: { 
        status: 'completed', 
        completedAt: new Date()
      }
    });

  } catch (error) {
    console.error(`[QR Send Job] Critical error in job ${job.id}:`, error);
    await prisma.qrSendJob.update({
      where: { id: job.id },
      data: { status: 'failed', completedAt: new Date() }
    });
  }
};

module.exports = {
  triggerQRSendForEvent,
  processQrSendJob,
  sendQRToRegistration
};
