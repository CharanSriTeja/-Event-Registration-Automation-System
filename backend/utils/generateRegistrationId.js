const prisma = require('../config/prisma');

const generateRegistrationId = async (eventId) => {
  const currentYear = new Date().getFullYear();
  
  // Get count of registrations for this specific event
  const count = await prisma.registration.count({
    where: {
      eventId: eventId
    }
  });

  const nextNumber = count + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  
  return `EVT-${currentYear}-${paddedNumber}`;
};

module.exports = generateRegistrationId;
