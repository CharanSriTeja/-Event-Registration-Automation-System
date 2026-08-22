require('dotenv').config();
const prisma = require('./config/prisma');
const cloudinary = require('./config/cloudinary');

const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let path = parts[1];
    if (path.match(/^v\d+\//)) {
      path = path.replace(/^v\d+\//, '');
    }
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      path = path.substring(0, lastDotIndex);
    }
    return path;
  } catch (e) {
    return null;
  }
};

async function wipeTestData() {
  console.log('Fetching all registrations to delete...');
  
  try {
    const registrations = await prisma.registration.findMany();
    
    if (registrations.length === 0) {
      console.log('No registrations found.');
    } else {
      for (const reg of registrations) {
        // 1. Delete payment screenshot from Cloudinary
        if (reg.paymentScreenshot) {
          const publicId = extractPublicId(reg.paymentScreenshot);
          if (publicId) {
            console.log(`Deleting payment screenshot: ${publicId}`);
            await cloudinary.uploader.destroy(publicId).catch(e => console.error(e));
          }
        }
        
        // 2. Delete QR code from Cloudinary
        if (reg.qrCodeUrl) {
          const publicId = extractPublicId(reg.qrCodeUrl);
          if (publicId) {
            console.log(`Deleting QR Code: ${publicId}`);
            await cloudinary.uploader.destroy(publicId).catch(e => console.error(e));
          }
        }
      }
      
      // 3. Delete all registrations
      const deleteResult = await prisma.registration.deleteMany();
      console.log(`Deleted ${deleteResult.count} registrations from the database.`);
    }

    // 4. Delete any QR Send Jobs (since they reference the events/registrations)
    await prisma.qrSendJob.deleteMany();
    console.log('Cleared all QrSendJobs.');

    // 5. Clear the EventCounter table
    await prisma.$queryRaw`DELETE FROM "EventCounter"`;
    console.log('EventCounter table reset successfully.');
    
    console.log('\n✅ All test registrations, files, and counters have been wiped! Your next registration will start at EVT-X-YYYY-0001.');

  } catch (err) {
    console.error('Error during wipe:', err);
  } finally {
    await prisma.$disconnect();
  }
}

wipeTestData();
