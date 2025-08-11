const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitization helper
const sanitizeString = (value) => {
  if (typeof value === 'string') {
    // Remove dangerous characters that could lead to XSS or injection
    return value.replace(/[<>\"'&]/g, '').trim();
  }
  return value;
};

// Authentication validations
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^[a-zA-Z0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
    .withMessage('Password contains invalid characters'),
  
  handleValidationErrors
];

const registerValidation = [
  body('employee_code')
    .isString()
    .withMessage('Employee code must be a string')
    .matches(/^(HR-EMP-|EX-THP-)\d{3,6}$/)
    .withMessage('Employee code must match pattern: HR-EMP-XXX to HR-EMP-XXXXXX or EX-THP-XXX to EX-THP-XXXXXX')
    .isLength({ max: 20 })
    .withMessage('Employee code must be less than 20 characters'),
  
  // Accept either 'name' OR 'first_name' + 'last_name'
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('first_name')
    .optional()
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('last_name')
    .optional()
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 0, max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .customSanitizer(sanitizeString),
  
  // Custom validation to ensure either name OR first_name+last_name is provided
  body()
    .custom((value, { req }) => {
      const hasName = req.body.name && req.body.name.trim().length > 0;
      const hasFirstName = req.body.first_name && req.body.first_name.trim().length > 0;
      
      if (!hasName && !hasFirstName) {
        throw new Error('Either name or first_name must be provided');
      }
      
      return true;
    })
    .withMessage('Either name or first_name must be provided'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^[a-zA-Z0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
    .withMessage('Password contains invalid characters'),
  
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  
  body('department')
    .optional()
    .isString()
    .withMessage('Department must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Department must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('designation')
    .optional()
    .isString()
    .withMessage('Designation must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Designation must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('company')
    .optional()
    .isString()
    .withMessage('Company must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters')
    .customSanitizer(sanitizeString),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either "active" or "inactive"'),
  
  handleValidationErrors
];

// Card validations
const employeeCodeParamValidation = [
  param('employee_code')
    .isString()
    .withMessage('Employee code must be a string')
    .matches(/^(HR-EMP-|EX-THP-)\d{3,6}$/)
    .withMessage('Employee code must match pattern: HR-EMP-XXX to HR-EMP-XXXXXX or EX-THP-XXX to EX-THP-XXXXXX')
    .isLength({ max: 20 })
    .withMessage('Employee code must be less than 20 characters'),
  
  handleValidationErrors
];

const createCardValidation = [
  body('employee_code')
    .isString()
    .withMessage('Employee code must be a string')
    .matches(/^(HR-EMP-|EX-THP-)\d{3,6}$/)
    .withMessage('Employee code must match pattern: HR-EMP-XXX to HR-EMP-XXXXXX or EX-THP-XXX to EX-THP-XXXXXX')
    .isLength({ max: 20 })
    .withMessage('Employee code must be less than 20 characters'),
  
  // Accept either 'name' OR 'first_name' + 'last_name'
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('first_name')
    .optional()
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('last_name')
    .optional()
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 0, max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .customSanitizer(sanitizeString),
  
  // Custom validation to ensure either name OR first_name+last_name is provided
  body()
    .custom((value, { req }) => {
      const hasName = req.body.name && req.body.name.trim().length > 0;
      const hasFirstName = req.body.first_name && req.body.first_name.trim().length > 0;
      
      if (!hasName && !hasFirstName) {
        throw new Error('Either name or first_name must be provided');
      }
      
      return true;
    })
    .withMessage('Either name or first_name must be provided'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  
  body('department')
    .optional()
    .isString()
    .withMessage('Department must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Department must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('designation')
    .optional()
    .isString()
    .withMessage('Designation must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Designation must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('company')
    .optional()
    .isString()
    .withMessage('Company must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters')
    .customSanitizer(sanitizeString),
  
  handleValidationErrors
];

const updateCardValidation = [
  ...employeeCodeParamValidation,
  ...createCardValidation
];

const changePasswordValidation = [
  ...employeeCodeParamValidation,
  
  // No validation for old password - user knows their own password
  // body('old_password') validation removed
  
  // Smart validation for new password - secure but user-friendly
  // Using 'new_password' to match what frontend actually sends
  body('new_password')
    .isString()
    .withMessage('New password must be a string')
    .isLength({ min: 6, max: 18 })
    .withMessage('New password must be between 6 and 18 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('New password must contain at least one special character'),
  
  handleValidationErrors
];

const adminResetPasswordValidation = [
  ...employeeCodeParamValidation,
  
  // No password validation needed for admin reset - system sets fixed password
  // body('newPassword') validation removed since admin sets password to 'Kaynescard@123'
  
  handleValidationErrors
];

// Company validations
const createCompanyValidation = [
  body('name')
    .isString()
    .withMessage('Company name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('branch_name')
    .optional()
    .isString()
    .withMessage('Branch name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Branch name must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Logo URL must be less than 500 characters'),
  
  body('theme_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Theme color must be a valid hex color (e.g., #AC212F)'),
  
  handleValidationErrors
];

const updateCompanyValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
  
  body('name')
    .optional()
    .isString()
    .withMessage('Company name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('branch_name')
    .optional()
    .isString()
    .withMessage('Branch name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Branch name must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Logo URL must be less than 500 characters'),
  
  body('theme_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Theme color must be a valid hex color (e.g., #AC212F)'),
  
  handleValidationErrors
];

const companyIdParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
  
  handleValidationErrors
];

const companyNameParamValidation = [
  param('company_name')
    .isString()
    .withMessage('Company name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  param('branch_name')
    .isString()
    .withMessage('Branch name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Branch name must be between 2 and 50 characters')
    .customSanitizer(sanitizeString),
  
  handleValidationErrors
];

// CSV validation
const csvUploadValidation = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('CSV file is required');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Superuser validations
const superuserValidation = [
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters'),
  
  handleValidationErrors
];

const adminPermissionsValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('permissions')
    .isObject()
    .withMessage('Permissions must be an object'),
  
  body('permissions.*')
    .isBoolean()
    .withMessage('Permission values must be boolean'),
  
  handleValidationErrors
];

const changeRoleValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('newRole')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"'),
  
  handleValidationErrors
];

// TOTP validations
const totpValidation = [
  body('totp')
    .isString()
    .withMessage('TOTP code must be a string')
    .isLength({ min: 6, max: 6 })
    .withMessage('TOTP code must be exactly 6 characters')
    .matches(/^\d{6}$/)
    .withMessage('TOTP code must contain only digits'),
  
  handleValidationErrors
];

const completeTotpSetupValidation = [
  body('secret')
    .isString()
    .withMessage('TOTP secret must be a string')
    .isLength({ min: 16, max: 32 })
    .withMessage('TOTP secret must be between 16 and 32 characters'),
  
  body('totp')
    .isString()
    .withMessage('TOTP code must be a string')
    .isLength({ min: 6, max: 6 })
    .withMessage('TOTP code must be exactly 6 characters')
    .matches(/^\d{6}$/)
    .withMessage('TOTP code must contain only digits'),
  
  handleValidationErrors
];

module.exports = {
  // Authentication
  loginValidation,
  registerValidation,
  
  // Cards
  employeeCodeParamValidation,
  createCardValidation,
  updateCardValidation,
  changePasswordValidation,
  adminResetPasswordValidation,
  
  // Company
  createCompanyValidation,
  updateCompanyValidation,
  companyIdParamValidation,
  companyNameParamValidation,
  
  // CSV
  csvUploadValidation,
  
  // Superuser
  superuserValidation,
  adminPermissionsValidation,
  changeRoleValidation,
  
  // TOTP
  totpValidation,
  completeTotpSetupValidation,
  
  // Utility
  handleValidationErrors,
  sanitizeString
};
