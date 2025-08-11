const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const csvController = require('../controllers/csvController');

// Secure CSV upload configuration
const upload = multer({ 
  dest: path.join(__dirname, '../../uploads/'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CSV files
    files: 1 // Only one file at a time
  },
  fileFilter: function (req, file, cb) {
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return cb(new Error('File size too large. Maximum 50MB allowed.'), false);
    }
    
    // Check MIME type
    const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
    
    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension !== '.csv') {
      return cb(new Error('Invalid file extension. Only .csv files are allowed.'), false);
    }
    
    cb(null, true);
  }
});

router.post('/upload', auth, upload.single('file'), validation.csvUploadValidation, csvController.uploadCSV);
router.post('/backup', auth, csvController.backupCards);
router.get('/backup-config', auth, csvController.getBackupConfig);
router.post('/backup-config', auth, csvController.setBackupConfig);

module.exports = router; 