const cloudinary = require('../config/cloudinary');

/**
 * Uploads an image buffer to Cloudinary.
 * @param {Buffer} fileBuffer - the raw image data (from multer memoryStorage)
 * @param {string} folder - Cloudinary folder to organize uploads
 * @returns {Promise<object>} - Cloudinary upload result (contains secure_url, public_id, etc.)
 */
const uploadImage = (fileBuffer, folder = 'radiology-xrays') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadImage };