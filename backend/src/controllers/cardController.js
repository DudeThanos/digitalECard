const pool = require('../utils/db');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Superuser audit logging function
function logSuperuserAction(action, details, req) {
  const SU_AUDIT_LOG = process.env.SU_AUDIT_LOG || 'su_audit.log';
  const now = new Date().toISOString();
  const username = req?.user?.username || req?.user?.email || process.env.SUPERUSER_USERNAME || '';
  const entry = `[${now}] ${action}: ${JSON.stringify({ ...details, username })}\n`;
  fs.appendFileSync(SU_AUDIT_LOG, entry);
}

exports.createCard = async (req, res) => {
  try {
    const {
      employee_code, name, first_name, last_name, email, phone, photo_url, password, role,
      department, designation, company, branch, address, status
    } = req.body;

    // Handle both old name field and new first_name/last_name fields
    let firstName = first_name || '';
    let lastName = last_name || '';
    let fullName = name || '';
    
    // If name is provided but first_name/last_name are not, split the name
    if (name && !first_name && !last_name) {
      if (name.trim().includes(' ')) {
        const parts = name.trim().split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        firstName = name.trim();
        lastName = '';
      }
      fullName = name.trim();
    } else if (first_name || last_name) {
      // If first_name/last_name are provided, construct the full name
      fullName = `${firstName} ${lastName}`.trim();
    }

    if (!employee_code || (!fullName && !firstName) || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 OR employee_code = $2',
      [email, employee_code]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or employee code already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    let totp_secret = null;
    let otpauth_url = null;
    if ((role || 'user') === 'admin') {
      const secret = require('speakeasy').generateSecret({ name: `Kaynes Digital Card (${email})` });
      totp_secret = secret.base32;
      otpauth_url = secret.otpauth_url;
    }
    const result = await pool.query(
      `INSERT INTO users (employee_code, name, first_name, last_name, email, phone, photo_url, password_hash, role, department, designation, company, branch, address, status, must_change_password, totp_secret)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE,$16) RETURNING id, employee_code, name, first_name, last_name, email, role, must_change_password, totp_secret` ,
      [employee_code, fullName, firstName, lastName, email, phone, photo_url, password_hash, role || 'user', department, designation, company, branch, address, status || 'active', totp_secret]
    );
    const user = result.rows[0];
    // Audit log if admin created
    if ((role || 'user') === 'admin' && req.user && req.user.id) {
      await pool.query('INSERT INTO admin_audit_log (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'CREATE_ADMIN', JSON.stringify({ employee_code, email })]);
    }
    return res.status(201).json({ user, totp: totp_secret ? { secret: totp_secret, otpauth_url } : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCardByEmployeeCode = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const result = await pool.query(
      `SELECT id, employee_code, name, first_name, last_name, email, phone, photo_url, role, department, designation, company, branch, address, status, created_at, updated_at, must_change_password, last_edited_by, last_edited_at
       FROM users WHERE employee_code = $1`,
      [employee_code]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    const card = result.rows[0];
    
    // If user has company and branch info, fetch company logo
    if (card.company) {
      try {
        const companyResult = await pool.query(
          'SELECT logo_url FROM company_master WHERE company_name = $1 AND branch_name = $2',
          [card.company, card.branch || 'Mumbai'] // Default to Mumbai if no branch specified
        );
        if (companyResult.rows.length > 0) {
          card.company_logo = companyResult.rows[0].logo_url;
        }
      } catch (err) {
        console.error('Error fetching company logo:', err);
        // Don't fail the request if company logo fetch fails
      }
    }
    
    res.json({ card });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.accessCardWithPassword = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE employee_code = $1', [employee_code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    // Exclude password_hash from response
    const { password_hash, ...card } = user;
    res.json({ card: { ...card, must_change_password: user.must_change_password } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCardQRCode = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const result = await pool.query(
      `SELECT name, first_name, last_name, email, phone, photo_url, company, department, designation, address FROM users WHERE employee_code = $1`,
      [employee_code]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    const user = result.rows[0];
    // Build vCard string (iOS/Android compatible) with all name fields
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = user.name || `${firstName} ${lastName}`.trim();
    
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${fullName}`,
      `EMAIL:${user.email || ''}`,
      `TEL;TYPE=CELL:${user.phone || ''}`,
      `ORG:${user.company || ''}`,
      `TITLE:${user.designation || ''}`,
      `ADR:${user.address || ''}`,
      'END:VCARD'
    ].join('\n');
    // Generate QR code as PNG
    res.setHeader('Content-Type', 'image/png');
    QRCode.toFileStream(res, vCard, { type: 'png' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { employee_code: userEmployeeCode, role, name: editorName } = req.user;
    
    // Check if user is authorized to edit this card
    if (role !== 'admin' && role !== 'superuser' && userEmployeeCode !== employee_code) {
      return res.status(403).json({ message: 'You can only edit your own card' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Save file path as photo_url (relative or absolute as needed)
    const photo_url = `/uploads/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET photo_url = $1, last_edited_by = $2, last_edited_at = CURRENT_TIMESTAMP WHERE employee_code = $3', 
      [photo_url, editorName || userEmployeeCode, employee_code]
    );
    res.json({ photo_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { employee_code: userEmployeeCode, role, name: editorName, permissions } = req.user;
    
    // Superusers can edit any card
    if (role === 'superuser') {
      // Continue with update logic
    }
    // Admins need edit_any_card permission
    else if (role === 'admin') {
      if (!permissions?.edit_any_card) {
        return res.status(403).json({ message: 'You do not have permission to edit cards' });
      }
    }
    // Regular users can only edit their own card
    else if (userEmployeeCode !== employee_code) {
      return res.status(403).json({ message: 'You can only edit your own card' });
    }
    
    const allowed = ['name', 'first_name', 'last_name', 'email', 'phone', 'photo_url', 'department', 'designation', 'company', 'branch', 'address', 'status'];
    
    // Check if role is being changed (not just present in request)
    const currentUser = await pool.query('SELECT role FROM users WHERE employee_code = $1', [employee_code]);
    if (currentUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentRole = currentUser.rows[0].role;
    const isRoleBeingChanged = req.body.role !== undefined && req.body.role !== currentRole;
    
    // Only superusers can change roles
    if (isRoleBeingChanged && role !== 'superuser') {
      return res.status(403).json({ message: 'Only superusers can change user roles' });
    }
    
    // Add role to allowed fields only for superusers or if role is not being changed
    if (role === 'superuser' || !isRoleBeingChanged) {
      allowed.push('role');
    }
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(req.body[key]);
        idx++;
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Add audit trail fields
    fields.push(`last_edited_by = $${idx}`);
    values.push(editorName || userEmployeeCode);
    idx++;
    
    fields.push(`last_edited_at = CURRENT_TIMESTAMP`);
    
    values.push(employee_code);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE employee_code = $${idx}`, values);
    // Audit log for admin/superuser update
    if (role === 'admin') {
      const updatedFields = allowed.filter(key => req.body[key] !== undefined);
      await pool.query('INSERT INTO admin_audit_log (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'UPDATE_CARD', JSON.stringify({ employee_code, updatedFields })]);
    } else if (role === 'superuser') {
      const updatedFields = allowed.filter(key => req.body[key] !== undefined);
      logSuperuserAction('UPDATE_CARD', { employee_code, updatedFields }, req);
    }
    res.json({ message: 'Card updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { employee_code: userEmployeeCode, role, permissions } = req.user;
    
    // Superusers can delete any card
    if (role === 'superuser') {
      const result = await pool.query('DELETE FROM users WHERE employee_code = $1 RETURNING id', [employee_code]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Card not found' });
      }
      logSuperuserAction('DELETE_CARD', { employee_code }, req);
      return res.json({ message: 'Card deleted successfully' });
    }
    
    // Admins need delete_any_card permission and cannot delete their own card
    if (role === 'admin') {
      if (!permissions?.delete_any_card) {
        return res.status(403).json({ message: 'You do not have permission to delete cards' });
      }
      
      if (userEmployeeCode === employee_code) {
        return res.status(403).json({ message: 'You cannot delete your own card' });
      }
      
      const result = await pool.query('DELETE FROM users WHERE employee_code = $1 RETURNING id', [employee_code]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Card not found' });
      }
      
      await pool.query('INSERT INTO admin_audit_log (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'DELETE_CARD', JSON.stringify({ employee_code })]);
      return res.json({ message: 'Card deleted successfully' });
    }
    
    // Regular users cannot delete any cards
    return res.status(403).json({ message: 'You do not have permission to delete cards' });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllCards = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_code, name, first_name, last_name, email, phone, photo_url, role, department, designation, company, branch, address, status, created_at, updated_at, must_change_password, last_edited_by, last_edited_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ cards: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}; 

// User changes their own password
exports.changePassword = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { old_password, new_password } = req.body;
    const { employee_code: userEmployeeCode, role } = req.user;
    if (role !== 'admin' && role !== 'superuser' && userEmployeeCode !== employee_code) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }
    if (!old_password || !new_password) {
      return res.status(400).json({ message: 'Old and new password required' });
    }
    const result = await pool.query('SELECT password_hash FROM users WHERE employee_code = $1', [employee_code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const valid = await bcrypt.compare(old_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }
    const new_hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE employee_code = $2', [new_hash, employee_code]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin resets any user's password
exports.adminResetPassword = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { role } = req.user;
    if (role !== 'admin' && role !== 'superuser') {
      return res.status(403).json({ message: 'Only admin or superuser can reset passwords' });
    }
    const userRes = await pool.query('SELECT id, role, email FROM users WHERE employee_code = $1', [employee_code]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userRes.rows[0];
    const new_hash = await bcrypt.hash('Kaynescard@123', 10);
    let totp_secret = null;
    let otpauth_url = null;
    if (user.role === 'admin') {
      const secret = require('speakeasy').generateSecret({ name: `Kaynes Digital Card (${user.email})` });
      totp_secret = secret.base32;
      otpauth_url = secret.otpauth_url;
      await pool.query('UPDATE users SET password_hash = $1, must_change_password = TRUE, totp_secret = $2, totp_enrolled = FALSE WHERE employee_code = $3', [new_hash, totp_secret, employee_code]);
    } else {
      await pool.query('UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE employee_code = $2', [new_hash, employee_code]);
    }
    res.json({ message: 'Password reset to Kaynescard@123. User must change password on next login.', totp: totp_secret ? { secret: totp_secret, otpauth_url } : null });
    // Audit log for admin/superuser password reset
    if (role === 'admin' && req.user && req.user.id) {
      await pool.query('INSERT INTO admin_audit_log (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'RESET_PASSWORD', JSON.stringify({ employee_code })]);
    } else if (role === 'superuser') {
      logSuperuserAction('RESET_PASSWORD', { employee_code }, req);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}; 

exports.getLastEmployeeCodes = async (req, res) => {
  try {
    // Find the highest number for each series
    const intRes = await pool.query(
      `SELECT employee_code FROM users WHERE employee_code LIKE 'HR-EMP-%' ORDER BY LENGTH(employee_code) DESC, employee_code DESC LIMIT 1`
    );
    const extRes = await pool.query(
      `SELECT employee_code FROM users WHERE employee_code LIKE 'EX-THP-%' ORDER BY LENGTH(employee_code) DESC, employee_code DESC LIMIT 1`
    );
    const lastInternal = intRes.rows[0]?.employee_code || 'HR-EMP-00000';
    const lastExternal = extRes.rows[0]?.employee_code || 'EX-THP-00000';
    // Extract the number part and compute next
    const intNum = parseInt(lastInternal.replace('HR-EMP-', ''), 10) || 0;
    const extNum = parseInt(lastExternal.replace('EX-THP-', ''), 10) || 0;
    const nextInternal = intNum + 1;
    const nextExternal = extNum + 1;
    const nextInternalCode = `HR-EMP-${String(nextInternal).padStart(5, '0')}`;
    const nextExternalCode = `EX-THP-${String(nextExternal).padStart(5, '0')}`;
    res.json({ nextInternalCode, nextExternalCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}; 

