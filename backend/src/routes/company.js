const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const companyController = require('../controllers/companyController');

// Get all companies (protected)
router.get('/', auth, companyController.getAllCompanies);

// Create new company (protected)
router.post('/', auth, companyController.createCompany);

// Update company (protected)
router.put('/:id', auth, companyController.updateCompany);

// Delete company (protected)
router.delete('/:id', auth, companyController.deleteCompany);

// Upload company logo (protected)
router.post('/:id/logo', auth, companyController.upload.single('logo'), companyController.uploadLogo);

// Get company by user (public route - no auth required)
router.get('/user/:company_name/:branch_name', companyController.getCompanyByUser);

module.exports = router; 