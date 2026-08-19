const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];

const coverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'event-registration/covers',
    allowed_formats: allowedFormats,
  },
});

const paymentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'event-registration/payment-screenshots',
    allowed_formats: allowedFormats,
  },
});

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadPayment = multer({
  storage: paymentStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = {
  uploadCover,
  uploadPayment
};
