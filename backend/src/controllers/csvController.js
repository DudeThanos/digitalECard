const pool = require('../utils/db');
const csv = require('csv-parse');
const fs = require('fs');
const bcrypt = require('bcrypt');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const BACKUP_DIR = '/home/avishek/Kaynescard_backup';
const fsPromises = require('fs').promises;
const cron = require('node-cron');
const CONFIG_PATH = path.join(__dirname, '../../backup_config.json');
const nodemailer = require('nodemailer');
let backupCronJob = null;

// Helper to load/save config
async function loadConfig() {
  try {
    const data = await fsPromises.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { backupDir: BACKUP_DIR, frequency: 'manual', notificationEmail: '' };
  }
}
async function saveConfig(config) {
  await fsPromises.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Helper to get cron expression from frequency
function getCronExpr(frequency) {
  switch (frequency) {
    case 'everyday': return '0 3 * * *'; // 3am daily
    case 'weekly': return '0 3 * * 0'; // 3am Sunday
    case 'monthly': return '0 3 1 * *'; // 3am 1st of month
    case 'yearly': return '0 3 31 12 *'; // 3am Dec 31
    default: return null;
  }
}

// Helper to perform the backup
async function performBackup(dir) {
  await fsPromises.mkdir(dir, { recursive: true });
  const result = await pool.query('SELECT * FROM users');
  let users = result.rows;
  // Replace password_hash with default password for backup CSV
  users = users.map(u => ({ ...u, password: 'Kaynescard@123' }));
  // Remove password_hash from CSV
  const { password_hash, ...sample } = users[0] || {};
  const fields = Object.keys(sample);
  // Prepare filename
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `${dateStr}_${timeStr}_dCard.csv`;
  const filePath = path.join(dir, filename);
  const csvWriter = createCsvWriter({
    path: filePath,
    header: fields.map(f => ({ id: f, title: f }))
  });
  await csvWriter.writeRecords(users.map(({ password_hash, ...rest }) => rest));
  const files = (await fsPromises.readdir(dir))
    .filter(f => f.endsWith('_dCard.csv'))
    .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  for (let i = 4; i < files.length; i++) {
    await fsPromises.unlink(path.join(dir, files[i].name));
  }
  return filePath;
}

// Helper to send email
async function sendBackupEmail(to, filePath) {
  if (!to || !process.env.BACKUP_EMAIL_USER || !process.env.BACKUP_EMAIL_PASS) {
    console.log('Email notification skipped - missing configuration or recipient');
    return;
  }

  try {
    // Configure SMTP transport
    const transporter = nodemailer.createTransport({
      service: process.env.BACKUP_EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.BACKUP_EMAIL_USER,
        pass: process.env.BACKUP_EMAIL_PASS
      }
    });

    const now = new Date();
    const fileName = path.basename(filePath);
    
    const mailOptions = {
      from: process.env.BACKUP_EMAIL_FROM || process.env.BACKUP_EMAIL_USER,
      to,
      subject: 'Kaynes Digital Card: Backup Completed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #AC212F;">Kaynes Digital Card Backup</h2>
          <p><strong>Backup completed successfully!</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Backup Details:</strong></p>
            <ul>
              <li><strong>Date:</strong> ${now.toLocaleDateString()}</li>
              <li><strong>Time:</strong> ${now.toLocaleTimeString()}</li>
              <li><strong>File:</strong> ${fileName}</li>
              <li><strong>Location:</strong> ${filePath}</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from the Kaynes Digital Card system.
          </p>
        </div>
      `,
      text: `Kaynes Digital Card Backup Completed\n\nDate: ${now.toLocaleDateString()}\nTime: ${now.toLocaleTimeString()}\nFile: ${fileName}\nLocation: ${filePath}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Backup confirmation email sent to', to);
  } catch (err) {
    console.error('Failed to send backup email:', err);
    // Don't throw error to avoid breaking backup process
  }
}

// Helper to check admin permissions
function hasBackupPermission(user) {
  if (!user) return false;
  if (user.role === 'superuser') return true;
  if (user.role === 'admin' && user.permissions && user.permissions.backup_settings) return true;
  return false;
}

// Schedule/Reschedule backup cron
async function scheduleBackupCron() {
  if (backupCronJob) backupCronJob.stop();
  const config = await loadConfig();
  const cronExpr = getCronExpr(config.frequency);
  if (!cronExpr) return;
  backupCronJob = cron.schedule(cronExpr, async () => {
    try {
      const filePath = await performBackup(config.backupDir || BACKUP_DIR);
      await sendBackupEmail(config.notificationEmail, filePath);
      console.log('Scheduled backup completed.');
    } catch (err) {
      console.error('Scheduled backup failed:', err);
    }
  });
}

exports.uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const results = [];
  const failed = [];
  const parser = fs.createReadStream(req.file.path).pipe(csv.parse({ columns: true, trim: true }));
  for await (const record of parser) {
    try {
      // Required fields: employee_code, name (or first_name/last_name), email, password
      if (!record.employee_code || (!record.name && (!record.first_name || !record.last_name)) || !record.email || !record.password) {
        failed.push({ record, error: 'Missing required fields' });
        continue;
      }
      // Check for existing user
      const existing = await pool.query('SELECT 1 FROM users WHERE email = $1 OR employee_code = $2', [record.email, record.employee_code]);
      if (existing.rows.length > 0) {
        failed.push({ record, error: 'User/email/employee_code already exists' });
        continue;
      }
      const password_hash = await bcrypt.hash(record.password, 10);
      
      // Handle name fields
      let firstName = record.first_name || '';
      let lastName = record.last_name || '';
      let fullName = record.name || '';
      
      // If name is provided but first_name/last_name are not, split the name
      if (record.name && !record.first_name && !record.last_name) {
        if (record.name.trim().includes(' ')) {
          const parts = record.name.trim().split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          firstName = record.name.trim();
          lastName = '';
        }
        fullName = record.name.trim();
      } else if (record.first_name || record.last_name) {
        // If first_name/last_name are provided, construct the full name
        fullName = `${firstName} ${lastName}`.trim();
      }
      
      await pool.query(
        `INSERT INTO users (employee_code, name, first_name, last_name, email, phone, photo_url, password_hash, role, department, designation, company, address, status, must_change_password)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE)` ,
        [record.employee_code, fullName, firstName, lastName, record.email, record.phone, record.photo_url, password_hash, record.role || 'user', record.department, record.designation, record.company, record.address, record.status || 'active']
      );
      results.push({ employee_code: record.employee_code, email: record.email });
    } catch (err) {
      failed.push({ record, error: err.message });
    }
  }
  // Remove uploaded file
  fs.unlinkSync(req.file.path);
  res.json({ created: results.length, failed: failed.length, results, failed });
};

// Route handler: always use config.backupDir
exports.backupCards = async (req, res) => {
  if (!hasBackupPermission(req.user)) {
    return res.status(403).json({ message: 'Forbidden: Backup access denied' });
  }
  try {
    const config = await loadConfig();
    const dir = config.backupDir || BACKUP_DIR;
    const filePath = await performBackup(dir);
    
    // Send email notification if configured
    if (config.notificationEmail) {
      await sendBackupEmail(config.notificationEmail, filePath);
    }
    
    res.json({ message: 'Backup successful', file: filePath });
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ message: 'Backup failed', error: err.message });
  }
};

// Get current backup config and status
exports.getBackupConfig = async (req, res) => {
  if (!hasBackupPermission(req.user)) {
    return res.status(403).json({ message: 'Forbidden: Backup access denied' });
  }
  const config = await loadConfig();
  res.json({ ...config, cronRunning: !!backupCronJob });
};

// Set backup config (dir, frequency)
exports.setBackupConfig = async (req, res) => {
  if (!hasBackupPermission(req.user)) {
    return res.status(403).json({ message: 'Forbidden: Backup access denied' });
  }
  const { backupDir, frequency, notificationEmail } = req.body;
  const config = await loadConfig();
  if (backupDir) config.backupDir = backupDir;
  if (frequency) config.frequency = frequency;
  if (notificationEmail !== undefined) config.notificationEmail = notificationEmail;
  await saveConfig(config);
  await scheduleBackupCron();
  res.json({ message: 'Backup config updated', config });
};

// Start cron on server start
scheduleBackupCron(); 