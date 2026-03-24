const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting 'Bearer <token>'
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Always refresh token for non-superusers to ensure permissions are current
    if (decoded.role !== 'superuser') {
      // Fetch current user data from database
      pool.query('SELECT * FROM users WHERE id = $1', [decoded.id])
        .then(result => {
          if (result.rows.length > 0) {
            const user = result.rows[0];
            // Create new token with current permissions
            const newToken = jwt.sign({ 
              id: user.id, 
              role: user.role, 
              employee_code: user.employee_code, 
              name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.employee_code,
              must_change_password: user.must_change_password,
              permissions: user.permissions || {}
            }, JWT_SECRET, { expiresIn: '7d' });
            
            // Set new token in response header
            res.set('X-New-Token', newToken);
            req.user = { 
              id: user.id, 
              role: user.role, 
              employee_code: user.employee_code, 
              name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.employee_code,
              must_change_password: user.must_change_password,
              permissions: user.permissions || {}
            };
            next();
          } else {
            return res.status(401).json({ message: 'User not found' });
          }
        })
        .catch(err => {
          console.error('Error refreshing token:', err);
          return res.status(500).json({ message: 'Server error' });
        });
    } else {
      req.user = decoded;
      next();
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}; 