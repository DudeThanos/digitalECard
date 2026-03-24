# Kaynes Digital Card - Production Deployment Guide

## Phase 1: Local Network Deployment (Office Testing)

### Prerequisites
- Ubuntu/Debian server (recommended: Ubuntu 20.04 LTS or newer)
- Node.js 16+ and npm
- MySQL/PostgreSQL database
- PM2 (Process Manager)
- Nginx (Reverse Proxy)

### Step 1: Server Setup

#### 1.1 Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MySQL (or PostgreSQL)
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

#### 1.2 Clone and Setup Application
```bash
# Clone your repository (or copy files)
cd /opt
sudo mkdir kaynes-vcard
sudo chown $USER:$USER kaynes-vcard
cd kaynes-vcard

# Copy your application files here
# Or clone from your git repository
```

### Step 2: Backend Configuration

#### 2.1 Environment Variables
Create `/opt/kaynes-vcard/backend/.env`:
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=kaynes_vcard
JWT_SECRET=your_very_secure_jwt_secret_key_here
CORS_ORIGIN=http://your-server-ip:3000
```

#### 2.2 Database Setup
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database and user
CREATE DATABASE kaynes_vcard;
CREATE USER 'kaynes_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON kaynes_vcard.* TO 'kaynes_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 2.3 Install Backend Dependencies
```bash
cd /opt/kaynes-vcard/backend
npm install --production
```

### Step 3: Frontend Configuration

#### 3.1 Build Frontend for Production
```bash
cd /opt/kaynes-vcard/frontend
npm install
npm run build
```

#### 3.2 Update API Base URL
Edit `frontend/src/pages/CardView.js`:
```javascript
// Change from:
const API_BASE = 'http://localhost:5000/api';
// To:
const API_BASE = 'http://your-server-ip:5000/api';
```

### Step 4: PM2 Process Management

#### 4.1 Create PM2 Ecosystem File
Create `/opt/kaynes-vcard/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'kaynes-backend',
      script: './backend/src/app.js',
      cwd: '/opt/kaynes-vcard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
```

#### 4.2 Start Application with PM2
```bash
cd /opt/kaynes-vcard
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Nginx Configuration

#### 5.1 Create Nginx Config
Create `/etc/nginx/sites-available/kaynes-vcard`:
```nginx
server {
    listen 80;
    server_name your-server-ip;

    # Frontend (React build)
    location / {
        root /opt/kaynes-vcard/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads directory
    location /uploads {
        alias /opt/kaynes-vcard/backend/uploads;
    }
}
```

#### 5.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/kaynes-vcard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Firewall Configuration
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### Step 7: Testing
1. **Local Network Access**: `http://your-server-ip`
2. **Test on different devices**: Laptops, phones, tablets
3. **Check functionality**: Login, card creation, viewing, etc.

## Phase 2: Global Deployment

### Step 1: Domain and SSL
1. **Purchase Domain**: (e.g., kaynes-vcard.com)
2. **DNS Configuration**: Point to your server's public IP
3. **SSL Certificate**: Install Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 2: Update Configuration
1. **Update CORS**: Allow your domain
2. **Update API URLs**: Use HTTPS
3. **Environment Variables**: Update for production

### Step 3: Monitoring and Logs
```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Security Checklist
- [ ] Strong database passwords
- [ ] JWT secret key
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Regular backups
- [ ] Monitoring setup

## Backup Strategy
```bash
# Database backup script
#!/bin/bash
mysqldump -u kaynes_user -p kaynes_vcard > /backup/kaynes_vcard_$(date +%Y%m%d_%H%M%S).sql
```

## Monitoring Commands
```bash
# Check application status
pm2 status
pm2 monit

# Check system resources
htop
df -h
free -h
```
