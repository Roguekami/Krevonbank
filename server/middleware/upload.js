const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

// Use memory storage — never write temp files to disk with untrusted names
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Upload buffer to Cloudinary with a server-generated filename
const uploadToCloudinary = (fileBuffer, mimeType, folder) => {
  return new Promise((resolve, reject) => {
    // Generate safe server-side filename — never use req.file.originalname
    // Don't append extension; Cloudinary will auto-append based on the file contents
    const publicId = `${folder}/${uuidv4()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: publicId,
        folder: 'krevon-kyc',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { upload, uploadToCloudinary };
