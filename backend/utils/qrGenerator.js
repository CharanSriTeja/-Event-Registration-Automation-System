const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

/**
 * Generates a secure QR code containing a signed JWT for a given registrationId
 * @param {string} registrationId 
 * @returns {Promise<string|null>} URL to the generated QR code image
 */
const generateQRCode = async (registrationId) => {
  try {
    // We sign the registrationId to prevent users from spoofing QR codes
    const payload = { registrationId };
    
    // We can use the existing ADMIN_JWT_SECRET, or ideally a dedicated QR_SECRET.
    // For this implementation, falling back to ADMIN_JWT_SECRET if QR_SECRET isn't defined.
    const secret = process.env.QR_SECRET || process.env.ADMIN_JWT_SECRET || 'fallback-secret';
    
    const signedToken = jwt.sign(payload, secret);
    
    // Generate QR code as a buffer
    const qrBuffer = await QRCode.toBuffer(signedToken, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Upload buffer to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'event-registration/qrcodes',
          public_id: registrationId,
          format: 'png'
        },
        (error, result) => {
          if (error) {
            console.error(`[QR Generator] Cloudinary upload failed for ${registrationId}:`, error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );

      // Write buffer to stream
      uploadStream.end(qrBuffer);
    });

  } catch (error) {
    console.error(`[QR Generator] Failed to generate QR code for ${registrationId}:`, error);
    return null;
  }
};

module.exports = {
  generateQRCode
};
