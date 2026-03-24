const pool = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const fs = require('fs');

const SUPERUSER_USERNAME = process.env.SUPERUSER_USERNAME;
const SUPERUSER_PASSWORD_HASH = process.env.SUPERUSER_PASSWORD_HASH;
const SUPERUSER_TOTP_SECRET = process.env.SUPERUSER_TOTP_SECRET;
// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const SU_AUDIT_LOG = process.env.SU_AUDIT_LOG || 'su_audit.log';

// System configuration file to track superuser TOTP setup
const SYSTEM_CONFIG_FILE = 'system_config.json';

function logSuperuserAction(action, details, req) {
  const now = new Date().toISOString();
  const username = req?.user?.username || req?.user?.email || process.env.SUPERUSER_USERNAME || '';
  const entry = `[${now}] ${action}: ${JSON.stringify({ ...details, username })}\n`;
  fs.appendFileSync(SU_AUDIT_LOG, entry);
}

// Helper function to load system configuration
function loadSystemConfig() {
  try {
    if (fs.existsSync(SYSTEM_CONFIG_FILE)) {
      const data = fs.readFileSync(SYSTEM_CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading system config:', err);
  }
  return { superuserTotpSetup: false };
}

// Helper function to save system configuration
function saveSystemConfig(config) {
  try {
    fs.writeFileSync(SYSTEM_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Error saving system config:', err);
  }
}

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

// Register a new user
exports.register = async (req, res) => {
  try {
    const {
      employee_code, name, email, phone, photo_url, password, role,
      department, designation, company, address, status
    } = req.body;

    // Check if user/email/employee_code already exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR employee_code = $2',
      [email, employee_code]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or employee code already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    // Set default permissions for admin role
    let permissions = {};
    if (role === 'admin') {
      permissions = {
        backup_settings: false, // Restricted - only superuser can grant this
        bulk_upload: true,
        single_card: true,
        view_all_cards: true,
        edit_any_card: true,
        delete_any_card: true,
        company_master: true,
        reset_user_password: true
      };
    }
    
    // Handle name fields properly
    let firstName = '';
    let lastName = '';
    
    if (name && name.trim().includes(' ')) {
      const parts = name.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = name || '';
      lastName = '';
    }
    
    // Remove TOTP setup for regular users - only superuser gets TOTP
    const result = await pool.query(
      `INSERT INTO users (employee_code, name, first_name, last_name, email, phone, photo_url, password_hash, role, department, designation, company, address, status, must_change_password, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE, $15) RETURNING *`,
      [employee_code, name, firstName, lastName, email, phone || null, photo_url || null, password_hash, role || 'user', department || null, designation || null, company || null, address || null, status || 'active', JSON.stringify(permissions)]
    );
    
    const user = result.rows[0];
    return res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user.id,
        employee_code: user.employee_code,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.employee_code,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Superuser login logic
    if (email === SUPERUSER_USERNAME) {
      const valid = await bcrypt.compare(password, SUPERUSER_PASSWORD_HASH);
      if (!valid) {
        logSuperuserAction('FAILED_LOGIN', { reason: 'Invalid password', ip: req.ip }, req);
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Check if superuser TOTP is set up
      const systemConfig = loadSystemConfig();
      
      if (!systemConfig.superuserTotpSetup) {
        // First time setup - use the fixed TOTP secret from .env
        const otpauth_url = speakeasy.otpauthURL({
          secret: SUPERUSER_TOTP_SECRET,
          label: SUPERUSER_USERNAME,
          issuer: 'Kaynes Digital Card',
          encoding: 'base32'
        });
        
        return res.json({ 
          requireTotpSetup: true, 
          totp: { 
            secret: SUPERUSER_TOTP_SECRET, 
            otpauth_url: otpauth_url 
          },
          userType: 'superuser'
        });
      } else {
        // TOTP is set up - require TOTP verification
        return res.json({ 
          requireTotp: true, 
          userType: 'superuser',
          totpSecret: SUPERUSER_TOTP_SECRET
        });
      }
    }
    
    // Regular user login (no TOTP for regular users)
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Migrate old permissions to new structure if needed
    let permissions = user.permissions || {};
    if (user.role === 'admin' && (permissions.can_backup || permissions.can_manage_users || permissions.can_view_audit)) {
      permissions = migratePermissions(permissions);
      // Update the user's permissions in the database
      await pool.query('UPDATE users SET permissions = $1 WHERE id = $2', [JSON.stringify(permissions), user.id]);
    }
    
    // Issue token for regular users (no TOTP required)
    const token = jwt.sign({ 
      id: user.id, 
      role: user.role, 
      employee_code: user.employee_code, 
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.employee_code,
      must_change_password: user.must_change_password,
      permissions: permissions
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        employee_code: user.employee_code, 
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.employee_code, 
        email: user.email, 
        role: user.role, 
        must_change_password: user.must_change_password,
        permissions: permissions
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify TOTP for superuser
exports.verifyTotp = async (req, res) => {
  try {
    const { totp, userType } = req.body;
    
    if (userType !== 'superuser') {
      return res.status(400).json({ message: 'Invalid user type for TOTP verification' });
    }
    
    const systemConfig = loadSystemConfig();
    
    if (!systemConfig.superuserTotpSetup) {
      return res.status(400).json({ message: 'Superuser TOTP not set up yet' });
    }
    
    // Verify TOTP using the stored secret
    const verified = speakeasy.totp.verify({
      secret: SUPERUSER_TOTP_SECRET,
      encoding: 'base32',
      token: totp,
      window: 2 // Allow 2 time steps for clock skew
    });
    
    if (!verified) {
      logSuperuserAction('FAILED_TOTP', { ip: req.ip }, req);
      return res.status(400).json({ message: 'Invalid TOTP code' });
    }
    
    // Generate token for superuser
    const token = jwt.sign({ 
      role: 'superuser', 
      username: SUPERUSER_USERNAME,
      permissions: {
        backup_settings: true,
        bulk_upload: true,
        single_card: true,
        view_all_cards: true,
        edit_any_card: true,
        delete_any_card: true,
        company_master: true,
        reset_user_password: true
      }
    }, JWT_SECRET, { expiresIn: '7d' });
    
    logSuperuserAction('LOGIN', { ip: req.ip }, req);
    return res.json({ 
      token, 
      user: { 
        username: SUPERUSER_USERNAME, 
        role: 'superuser',
        permissions: {
          backup_settings: true,
          bulk_upload: true,
          single_card: true,
          view_all_cards: true,
          edit_any_card: true,
          delete_any_card: true,
          company_master: true,
          reset_user_password: true
        }
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete TOTP setup for superuser
exports.completeTotpSetup = async (req, res) => {
  try {
    const { totp } = req.body;
    
    const systemConfig = loadSystemConfig();
    
    if (systemConfig.superuserTotpSetup) {
      return res.status(400).json({ message: 'TOTP is already set up' });
    }
    
    // Verify the TOTP code using the fixed secret from .env
    const verified = speakeasy.totp.verify({
      secret: SUPERUSER_TOTP_SECRET,
      encoding: 'base32',
      token: totp,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid TOTP code' });
    }
    
    // Mark TOTP as set up
    systemConfig.superuserTotpSetup = true;
    saveSystemConfig(systemConfig);
    
    logSuperuserAction('TOTP_SETUP_COMPLETED', { ip: req.ip }, req);
    
    res.json({ message: 'TOTP setup completed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system configuration (superuser only)
exports.getSystemConfig = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'superuser') {
      return res.status(403).json({ message: 'Forbidden: Superuser only' });
    }
    
    const systemConfig = loadSystemConfig();
    res.json({ 
      superuserTotpSetup: systemConfig.superuserTotpSetup 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Note: TOTP is now only for superuser, removed admin TOTP functions

// List all admins (SU only)
exports.listAdmins   = async (req, res) => {
  if (!req.user || req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Forbidden: Superuser only' });
  }
  const result = await pool.query("SELECT id, employee_code, name, email, role, permissions FROM users WHERE role = 'admin'");
  res.json({ admins: result.rows });
};

// Update admin permissions (SU only, granular features)
exports.updateAdminPermissions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'superuser') {
      return res.status(403).json({ message: 'Forbidden: Superuser only' });
    }
    
    const { admin_id, permissions } = req.body;
    if (!admin_id || !permissions) {
      return res.status(400).json({ message: 'admin_id and permissions required' });
    }

    // First check if the admin exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [admin_id, 'admin']);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Update the permissions
    const result = await pool.query('UPDATE users SET permissions = $1 WHERE id = $2 AND role = $3', [permissions, admin_id, 'admin']);
    
    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to update permissions' });
    }

    // Log the permission update
    logSuperuserAction('UPDATE_ADMIN_PERMISSIONS', { 
      admin_id, 
      permissions,
      updated_by: req.user.username || 'superuser'
    }, req);
    
    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    res.status(500).json({ message: 'Internal server error while updating permissions' });
  }
};

// View SU audit log (SU only)
exports.getSUAuditLog = (req, res) => {
  if (!req.user || req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Forbidden: Superuser only' });
  }
  try {
    const log = fs.readFileSync(SU_AUDIT_LOG, 'utf-8');
    res.type('text/plain').send(log);
  } catch (err) {
    res.status(500).json({ message: 'Could not read audit log' });
  }
};

// Superuser: View all admin audit logs
exports.getAdminAuditLogs = async (req, res) => {
  if (!req.user || req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Forbidden: Superuser only' });
  }
  try {
    const logs = await pool.query(`
      SELECT l.id, u.email as admin_email, l.action, l.details, l.created_at
      FROM admin_audit_log l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.created_at DESC
    `);
    res.json(logs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch admin audit logs' });
  }
};

// Superuser: Clear SU audit log
exports.clearSUAuditLog = (req, res) => {
  if (!req.user || req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Forbidden: Superuser only' });
  }
  try {
    fs.writeFileSync(SU_AUDIT_LOG, '');
    res.json({ message: 'Superuser audit log cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not clear audit log' });
  }
};

// Superuser: Clear admin audit log
exports.clearAdminAuditLog = async (req, res) => {
  if (!req.user || req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Forbidden: Superuser only' });
  }
  try {
    await pool.query('DELETE FROM admin_audit_log');
    res.json({ message: 'Admin audit log cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not clear admin audit log' });
  }
}; 

// Superuser only: Change user role (user to admin)
exports.changeUserRole = async (req, res) => {
  try {
    // Only superuser can change roles
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ message: 'Forbidden: Only superuser can change user roles' });
    }

    const { employee_code, new_role } = req.body;
    
    if (!employee_code || !new_role) {
      return res.status(400).json({ message: 'Employee code and new role are required' });
    }

    if (!['user', 'admin'].includes(new_role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id, role, email FROM users WHERE employee_code = $1', [employee_code]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // If promoting to admin, set default admin permissions
    let permissions = user.permissions || {};
    if (new_role === 'admin') {
      permissions = {
        backup_settings: false, // Restricted - only superuser can grant this
        bulk_upload: true,
        single_card: true,
        view_all_cards: true,
        edit_any_card: true,
        delete_any_card: true,
        company_master: true,
        reset_user_password: true
      };
    } else if (new_role === 'user') {
      // Remove admin permissions when demoting to user
      permissions = {};
    }

    // Update user role and permissions
    await pool.query(
      'UPDATE users SET role = $1, permissions = $2, updated_at = CURRENT_TIMESTAMP WHERE employee_code = $3',
      [new_role, JSON.stringify(permissions), employee_code]
    );

    // Log the role change
    logSuperuserAction('ROLE_CHANGE', { 
      target_employee_code: employee_code, 
      target_email: user.email,
      old_role: user.role, 
      new_role: new_role 
    }, req);

    res.json({ 
      message: `User role changed successfully from ${user.role} to ${new_role}`,
      user: { employee_code, email: user.email, role: new_role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}; 