const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sendConfirmationEmail } = require('../utils/emailService');

const runTest = async () => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error("Error: BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in .env");
    process.exit(1);
  }

  console.log("Testing Brevo Email Integration...");
  
  // Replace this with your own email to test
  const testEmail = "charansritejachilukuri@gmail.com"; 
  const testName = "Test User";
  
  const success = await sendConfirmationEmail(
    testEmail,
    testName,
    "EVT-TEST-001",
    "Test Event Registration"
  );
  
  if (success) {
    console.log(`\nSuccess! Check the inbox for ${testEmail}`);
  } else {
    console.error(`\nFailed to send email. Check the error logs above.`);
  }
};

runTest();
