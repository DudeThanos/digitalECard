const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const companyController = require('../controllers/companyController');

// Get all companies (protected)
router.get('/', auth, companyController.getAllCompanies);

// Create new company (protected)
router.post('/', auth, validation.createCompanyValidation, companyController.createCompany);

// Update company (protected)
router.put('/:id', auth, validation.updateCompanyValidation, companyController.updateCompany);

// Delete company (protected)
router.delete('/:id', auth, validation.companyIdParamValidation, companyController.deleteCompany);

// Upload company logo (protected)
router.post('/:id/logo', auth, validation.companyIdParamValidation, companyController.upload.single('logo'), companyController.uploadLogo);

// Get company by user (public route - no auth required)
router.get('/user/:company_name/:branch_name', validation.companyNameParamValidation, companyController.getCompanyByUser);

module.exports = router; 