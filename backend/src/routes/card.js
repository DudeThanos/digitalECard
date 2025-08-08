const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
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

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get last used employee codes for both series (must be before any /:employee_code routes)
router.get('/last-employee-codes', cardController.getLastEmployeeCodes);

// Get all cards (protected) - This must come before /:employee_code routes
router.get('/cards', auth, cardController.getAllCards);

router.post('/create', auth, cardController.createCard);
router.post('/:employee_code/access', cardController.accessCardWithPassword);
router.get('/:employee_code', cardController.getCardByEmployeeCode);
router.get('/:employee_code/qrcode', cardController.getCardQRCode);
router.post('/:employee_code/change-password', auth, cardController.changePassword);
router.post('/:employee_code/admin-reset-password', auth, cardController.adminResetPassword);

// Photo upload (protected)
router.post('/:employee_code/photo', auth, upload.single('photo'), cardController.uploadPhoto);
// Card update (protected)
router.put('/:employee_code/update', auth, cardController.updateCard);
// Card delete (protected)
router.delete('/:employee_code', auth, cardController.deleteCard);

module.exports = router; 