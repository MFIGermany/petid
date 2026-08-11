const multer = require('multer');

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const uploadPetPhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      return cb(new Error('Formato de imagem não permitido. Use JPG, PNG ou WEBP.'));
    }

    cb(null, true);
  }
});

module.exports = { uploadPetPhoto };
