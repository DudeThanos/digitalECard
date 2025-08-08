const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/auth');
const csvController = require('../controllers/csvController');

const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

router.post('/upload', auth, upload.single('file'), csvController.uploadCSV);
router.post('/backup', auth, csvController.backupCards);
router.get('/backup-config', auth, csvController.getBackupConfig);
router.post('/backup-config', auth, csvController.setBackupConfig);

module.exports = router; 