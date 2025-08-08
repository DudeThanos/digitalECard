const pool = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for company logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/company_logos/');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const getAllCompanies = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM company_master ORDER BY company_name, branch_name'
    );
    res.json({ companies: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCompany = async (req, res) => {
  try {
    const { company_name, branch_name } = req.body;
    
    if (!company_name || !branch_name) {
      return res.status(400).json({ message: 'Company name and branch name are required' });
    }

    // Check if company-branch combination already exists
    const existing = await pool.query(
      'SELECT 1 FROM company_master WHERE company_name = $1 AND branch_name = $2',
      [company_name, branch_name]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Company-branch combination already exists' });
    }

    const result = await pool.query(
      'INSERT INTO company_master (company_name, branch_name) VALUES ($1, $2) RETURNING *',
      [company_name, branch_name]
    );
    
    res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, branch_name } = req.body;
    
    if (!company_name || !branch_name) {
      return res.status(400).json({ message: 'Company name and branch name are required' });
    }

    // Check if the new combination already exists (excluding current record)
    const existing = await pool.query(
      'SELECT 1 FROM company_master WHERE company_name = $1 AND branch_name = $2 AND id != $3',
      [company_name, branch_name, id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Company-branch combination already exists' });
    }

    const result = await pool.query(
      'UPDATE company_master SET company_name = $1, branch_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [company_name, branch_name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ company: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM company_master WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const logo_url = `/uploads/company_logos/${req.file.filename}`;
    
    const result = await pool.query(
      'UPDATE company_master SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [logo_url, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ company: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCompanyByUser = async (req, res) => {
  try {
    const { company_name, branch_name } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM company_master WHERE company_name = $1 AND branch_name = $2',
      [company_name, branch_name]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ company: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadLogo,
  getCompanyByUser,
  upload
}; 