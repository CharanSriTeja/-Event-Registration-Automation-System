require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
  const reg = await prisma.registration.findFirst({ orderBy: { registeredAt: 'desc' } });
  console.log('Latest Registration Payment Screenshot:', reg?.paymentScreenshot);
}

main().finally(() => prisma.$disconnect());
