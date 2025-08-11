const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const cardController = require('../controllers/cardController');
const multer = require('multer');
const path = require('path');

// Configure multer to preserve file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'))
  },
  filename: function (req, file, cb) {
    // Preserve original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

// Secure file upload configuration
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: function (req, file, cb) {
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      return cb(new Error('File size too large. Maximum 5MB allowed.'), false);
    }
    
    // Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp are allowed.'), false);
    }
    
    cb(null, true);
  }
});

// Get last used employee codes for both series (must be before any /:employee_code routes)
router.get('/last-employee-codes', cardController.getLastEmployeeCodes);

// Get all cards (protected) - This must come before /:employee_code routes
router.get('/cards', auth, cardController.getAllCards);

router.post('/create', auth, validation.createCardValidation, cardController.createCard);
router.post('/:employee_code/access', validation.employeeCodeParamValidation, cardController.accessCardWithPassword);
router.get('/:employee_code', validation.employeeCodeParamValidation, cardController.getCardByEmployeeCode);
router.get('/:employee_code/qrcode', validation.employeeCodeParamValidation, cardController.getCardQRCode);
router.post('/:employee_code/change-password', auth, validation.changePasswordValidation, cardController.changePassword);
router.post('/:employee_code/admin-reset-password', auth, validation.adminResetPasswordValidation, cardController.adminResetPassword);

// Rate limiting for photo uploads only
const photoUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 photo uploads per windowMs
  message: 'Too many photo uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Photo upload (protected)
router.post('/:employee_code/photo', auth, validation.employeeCodeParamValidation, photoUploadLimiter, upload.single('photo'), cardController.uploadPhoto);
// Card update (protected)
router.put('/:employee_code/update', auth, validation.updateCardValidation, cardController.updateCard);
// Card delete (protected)
router.delete('/:employee_code', auth, validation.employeeCodeParamValidation, cardController.deleteCard);

module.exports = router; 