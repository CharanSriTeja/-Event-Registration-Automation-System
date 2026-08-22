const prisma = require('../config/prisma');

async function generateRegistrationId(eventId) {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`
    INSERT INTO "EventCounter" ("eventId", "lastNumber")
    VALUES (
      ${eventId}, 
      COALESCE((SELECT COUNT(*)::int FROM "Registration" WHERE "eventId" = ${eventId}), 0) + 1
    )
    ON CONFLICT ("eventId")
    DO UPDATE SET "lastNumber" = GREATEST("EventCounter"."lastNumber" + 1, COALESCE((SELECT COUNT(*)::int FROM "Registration" WHERE "eventId" = ${eventId}), 0) + 1)
    RETURNING "lastNumber";
  `;
  const num = result[0].lastNumber;
  // Format: EVT-{eventId}-{year}-0001 (e.g., EVT-5-2026-0001)
  return `EVT-${eventId}-${year}-${String(num).padStart(4, '0')}`;
}

module.exports = generateRegistrationId;
