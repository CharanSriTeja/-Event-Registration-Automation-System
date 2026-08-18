const prisma = require('../config/prisma');

const generateRegistrationId = async (eventId) => {
  const currentYear = new Date().getFullYear();
  
  // Get the last inserted registration to find the next reliable global number
  const lastRegistration = await prisma.registration.findFirst({
    orderBy: {
      id: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastRegistration) {
    // Use the autoincrement ID to ensure we never reuse numbers, even across different events
    nextNumber = lastRegistration.id + 1;
  }

  const paddedNumber = String(nextNumber).padStart(4, '0');
  
  return `EVT-${currentYear}-${paddedNumber}`;
};

module.exports = generateRegistrationId;
