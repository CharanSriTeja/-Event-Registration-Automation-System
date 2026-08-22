const axios = require('axios');
const prisma = require('./config/prisma');

async function testFixes() {
const baseURL = 'http://127.0.0.1:5000/api';

  try {
    console.log('Testing login rate limiting...');
    let rateLimitHit = false;
    for (let i = 0; i < 7; i++) {
      try {
        const res = await axios.post(`${baseURL}/admin/login`, { username: 'test', password: 'test' });
        console.log(`Attempt ${i+1}: Status ${res.status}`);
      } catch (err) {
        if (err.response && err.response.status === 429) {
          console.log(`Attempt ${i+1}: Hit rate limit correctly! Message: ${err.response.data.message}`);
          rateLimitHit = true;
          break;
        } else {
          console.log(`Attempt ${i+1}: Unexpected error ${err.response ? err.response.status : err.message}`);
        }
      }
    }
    
    // Test Atomic Registration ID
    let event = await prisma.event.findFirst();
    if (!event) {
      console.log('Creating a test event...');
      event = await prisma.event.create({
        data: {
          name: 'Test Event',
          date: new Date(),
          venue: 'Test Venue',
          capacity: 100
        }
      });
    }

    const generateRegistrationId = require('./utils/generateRegistrationId');
    console.log('Generating ID for event', event.id);
    const id = await generateRegistrationId(event.id);
    console.log('Generated ID:', id);
    
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testFixes();
