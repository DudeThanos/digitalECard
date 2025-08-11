const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const pool = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to migrate old permissions to new structure
function migratePermissions(oldPermissions) {
  if (!oldPermissions) return {};
  
  const newPermissions = {};
  
  // Map old permissions to new ones
  if (oldPermissions.can_backup) {
    newPermissions.backup_settings = true;
  }
  if (oldPermissions.can_manage_users) {
    newPermissions.single_card = true;
    newPermissions.view_all_cards = true;
    newPermissions.edit_any_card = true;
    newPermissions.delete_any_card = true;
    newPermissions.reset_user_password = true;
  }
  if (oldPermissions.can_view_audit) {
    newPermissions.backup_settings = true; // Audit logs are part of backup settings
  }
  
  // Set default permissions for admin role
  if (Object.keys(newPermissions).length === 0) {
    newPermissions.single_card = true;
    newPermissions.view_all_cards = true;
    newPermissions.edit_any_card = true;
    newPermissions.delete_any_card = true;
    newPermissions.reset_user_password = true;
  }
  
  return newPermissions;
}

// Strict rate limiting for login to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 login attempts per windowMs
  message: 'Too many login attempts, please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts, please try again in 15 minutes.',
      retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
    });
  }
});

router.post('/register', validation.registerValidation, authController.register);
router.post('/login', loginLimiter, validation.loginValidation, authController.login);
router.get('/su/admins', auth, authController.listAdmins);
router.post('/su/admins/permissions', auth, validation.adminPermissionsValidation, authController.updateAdminPermissions);
router.post('/su/change-role', auth, validation.changeRoleValidation, authController.changeUserRole);
router.get('/su/audit-log', auth, authController.getSUAuditLog);
// Rate limiting for TOTP verification
const totpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 TOTP attempts per windowMs
  message: 'Too many TOTP verification attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

router.post('/verify-totp', totpLimiter, validation.totpValidation, authController.verifyTotp);
router.post('/complete-totp-setup', totpLimiter, validation.completeTotpSetupValidation, authController.completeTotpSetup);
router.get('/system-config', auth, authController.getSystemConfig);
router.get('/su/admin-logs', auth, authController.getAdminAuditLogs);
router.delete('/su/audit-log', auth, authController.clearSUAuditLog);
router.delete('/su/admin-logs', auth, authController.clearAdminAuditLog);
router.post('/su/reset-db', auth, validation.superuserValidation, async (req, res) => {
  // Only allow superuser
  if (!req.user || req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Forbidden: Superuser only' });
  }
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }
  try {
    const valid = await bcrypt.compare(password, process.env.SUPERUSER_PASSWORD_HASH);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }
    // Delete all users (superuser is not in DB)
    await pool.query('DELETE FROM users');
    // Optionally clear audit logs, etc.
    res.json({ message: 'All user and card data deleted. Superuser remains.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset database.' });
  }
});
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, employee_code, name, email, role, permissions FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = result.rows[0];
    
    // Migrate old permissions to new structure if needed
    let permissions = user.permissions || {};
    if (user.role === 'admin' && (permissions.can_backup || permissions.can_manage_users || permissions.can_view_audit)) {
      permissions = migratePermissions(permissions);
      // Update the user's permissions in the database
      await pool.query('UPDATE users SET permissions = $1 WHERE id = $2', [JSON.stringify(permissions), user.id]);
      user.permissions = permissions;
    }
    
    // Create new token with current permissions if needed
    if (req.user.role !== 'superuser' && (!req.user.permissions || Object.keys(req.user.permissions).length === 0)) {
      const newToken = jwt.sign({ 
        id: user.id, 
        role: user.role, 
        employee_code: user.employee_code, 
        must_change_password: user.must_change_password,
        permissions: permissions
      }, JWT_SECRET, { expiresIn: '7d' });
      
      res.set('X-New-Token', newToken);
    }
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint to check JWT token contents
router.get('/test-token', auth, async (req, res) => {
  res.json({ 
    user: req.user,
    hasPermissions: !!req.user.permissions,
    permissionKeys: req.user.permissions ? Object.keys(req.user.permissions) : []
  });
});

// Force token refresh endpoint
router.post('/refresh-token', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    const newToken = jwt.sign({ 
      id: user.id, 
      role: user.role, 
      employee_code: user.employee_code, 
      must_change_password: user.must_change_password,
      permissions: user.permissions || {}
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token: newToken,
      user: {
        id: user.id,
        employee_code: user.employee_code,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || {}
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Permission validation endpoints
router.get('/permission/backup-settings', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.backup_settings === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/bulk-upload', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.bulk_upload === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/single-card', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.single_card === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/view-all-cards', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.view_all_cards === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/edit-any-card', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.edit_any_card === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/delete-any-card', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.delete_any_card === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/company-master', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.company_master === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/permission/reset-user-password', auth, async (req, res) => {
  try {
    if (req.user.role === 'superuser') {
      return res.json({ hasPermission: true });
    }
    
    const permissions = req.user.permissions || {};
    const hasPermission = permissions.reset_user_password === true;
    
    res.json({ hasPermission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 