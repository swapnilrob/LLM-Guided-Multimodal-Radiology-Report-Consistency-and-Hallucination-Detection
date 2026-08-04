const multer = require('multer');

// Store files in memory temporarily (we'll push to Cloudinary in Phase 4)
const storage = multer.memoryStorage();

// Allowed image types for chest X-rays
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // accept the file
  } else {
    cb(
      new Error('Invalid file type. Only JPEG and PNG images are allowed.'),
      false
    ); // reject the file
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = upload;