const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const qrcodesDir = path.join(__dirname, '..', 'uploads', 'qrcodes');
if (!fs.existsSync(qrcodesDir)) {
  fs.mkdirSync(qrcodesDir, { recursive: true });
}

/**
 * Generates a secure QR code containing a signed JWT for a given registrationId
 * @param {string} registrationId 
 * @returns {Promise<string|null>} Path to the generated QR code image
 */
const generateQRCode = async (registrationId) => {
  try {
    // We sign the registrationId to prevent users from spoofing QR codes
    const payload = { registrationId };
    
    // We can use the existing ADMIN_JWT_SECRET, or ideally a dedicated QR_SECRET.
    // For this implementation, falling back to ADMIN_JWT_SECRET if QR_SECRET isn't defined.
    const secret = process.env.QR_SECRET || process.env.ADMIN_JWT_SECRET || 'fallback-secret';
    
    const signedToken = jwt.sign(payload, secret);
    
    // Create absolute path for saving
    const fileName = `${registrationId}.png`;
    const filePath = path.join(qrcodesDir, fileName);
    
    // Generate and save QR code
    await QRCode.toFile(filePath, signedToken, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Return the relative URL path to be stored in the DB and sent via email
    return `/uploads/qrcodes/${fileName}`;
  } catch (error) {
    console.error(`[QR Generator] Failed to generate QR code for ${registrationId}:`, error);
    return null;
  }
};

module.exports = {
  generateQRCode
};
