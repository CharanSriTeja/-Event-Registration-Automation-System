const cron = require('node-cron');
const prisma = require('../config/prisma');
const { processQrSendJob, triggerQRSendForEvent } = require('./qrSendService');

const startCronJobs = () => {
  // ---------------------------------------------------------
  // 1. Minutely Cron Job (Job-based Queue Processing)
  // Runs every minute to pick up pending QrSendJobs
  // ---------------------------------------------------------
  cron.schedule('* * * * *', async () => {
    try {
      // Find jobs that are due
      const pendingJobs = await prisma.qrSendJob.findMany({
        where: {
          status: 'pending',
          scheduledAt: { lte: new Date() }
        }
      });

      for (const job of pendingJobs) {
        // Atomic lock: try to change status to processing.
        // If it's already processing (e.g. by another instance), this will safely ignore it
        // Since we are running in a single instance mostly, this is a basic lock.
        const updatedJob = await prisma.qrSendJob.updateMany({
          where: { id: job.id, status: 'pending' },
          data: { status: 'processing' }
        });

        if (updatedJob.count > 0) {
          console.log(`[Cron] Starting processing for QrSendJob ID: ${job.id}`);
          // Do not await the job here so that we don't block the cron interval 
          // if it takes a long time (e.g., 60 minutes for a big batch).
          // We fire and forget it.
          processQrSendJob(job.id);
        }
      }
    } catch (error) {
      console.error('[Cron] Error processing pending QR jobs:', error);
    }
  });

  // ---------------------------------------------------------
  // 2. Daily Cron Job (Legacy/Default Auto-Sender)
  // Runs every day at 9:00 AM to send QRs for events EXACTLY 1 day away
  // ---------------------------------------------------------
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[Cron] Running daily check for events 1 day away...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startOfTomorrow = new Date(tomorrow.setHours(0,0,0,0));
      const endOfTomorrow = new Date(tomorrow.setHours(23,59,59,999));

      const events = await prisma.event.findMany({
        where: {
          date: {
            gte: startOfTomorrow,
            lte: endOfTomorrow
          }
        }
      });

      for (const event of events) {
        console.log(`[Cron] Triggering auto-send for Event: ${event.name}`);
        // We can use the unthrottled trigger or schedule a new job for it.
        // For simplicity, we just trigger it immediately.
        await triggerQRSendForEvent(event.id);
      }
    } catch (error) {
      console.error('[Cron] Error running daily auto-sender:', error);
    }
  });

  console.log('[Cron] Cron jobs initialized successfully.');
};

module.exports = {
  startCronJobs
};
