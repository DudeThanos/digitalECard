const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

router.get('/', auth, (req, res) => {
  res.json({ message: `Welcome, ${req.user.employee_code}! You have accessed a protected route.` });
});

module.exports = router; 