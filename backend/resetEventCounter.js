const prisma = require('./config/prisma');
async function main() {
  await prisma.$queryRaw`DELETE FROM "EventCounter"`;
  console.log('EventCounter cleared successfully.');
  await prisma.$disconnect();
}
main();
