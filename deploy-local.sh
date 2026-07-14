#!/bin/bash

# Kaynes Digital Card - Local Network Deployment Script
# Run this script on your production server

set -e  # Exit on any error

echo "🚀 Starting Kaynes Digital Card Local Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
print_status "Detected server IP: $SERVER_IP"

# Step 1: Install required software
print_status "Installing required software..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install nginx -y
else
    print_status "Nginx already installed"
fi

# Install MySQL
if ! command -v mysql &> /dev/null; then
    print_status "Installing MySQL..."
    sudo apt install mysql-server -y
    print_warning "Please run 'sudo mysql_secure_installation' after this script completes"
else
    print_status "MySQL already installed"
fi

# Step 2: Setup application directory
print_status "Setting up application directory..."

sudo mkdir -p /opt/kaynes-vcard
sudo chown $USER:$USER /opt/kaynes-vcard

# Copy application files
print_status "Copying application files..."
cp -r backend /opt/kaynes-vcard/
cp -r frontend /opt/kaynes-vcard/

# Step 3: Backend setup
print_status "Setting up backend..."

cd /opt/kaynes-vcard/backend

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=kaynes_user
DB_PASSWORD=kaynes_secure_password_$(date +%s)
DB_NAME=kaynes_vcard
JWT_SECRET=kaynes_jwt_secret_$(date +%s)_$(openssl rand -hex 32)
CORS_ORIGIN=http://$SERVER_IP
EOF

print_status "Created .env file with secure credentials"

# Install dependencies
npm install --production

# Step 4: Frontend setup
print_status "Setting up frontend..."

cd /opt/kaynes-vcard/frontend

# Update API base URL
sed -i "s|http://localhost:5000/api|http://$SERVER_IP:5000/api|g" src/pages/CardView.js

# Install dependencies and build
npm install
npm run build

print_status "Frontend built successfully"

# Step 5: Database setup
print_status "Setting up database..."

# Create database and user
sudo mysql -e "CREATE DATABASE IF NOT EXISTS kaynes_vcard;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'kaynes_user'@'localhost' IDENTIFIED BY 'kaynes_secure_password_$(date +%s)';"
sudo mysql -e "GRANT ALL PRIVILEGES ON kaynes_vcard.* TO 'kaynes_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

print_status "Database setup completed"

# Step 6: PM2 setup
print_status "Setting up PM2..."

cd /opt/kaynes-vcard

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
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
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_status "PM2 setup completed"

# Step 7: Nginx setup
print_status "Setting up Nginx..."

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/kaynes-vcard > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # Frontend (React build)
    location / {
        root /opt/kaynes-vcard/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Uploads directory
    location /uploads {
        alias /opt/kaynes-vcard/backend/uploads;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/kaynes-vcard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

print_status "Nginx setup completed"

# Step 8: Firewall setup
print_status "Setting up firewall..."

sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw --force enable

print_status "Firewall configured"

# Step 9: Final checks
print_status "Performing final checks..."

# Check if services are running
if pm2 list | grep -q "kaynes-backend"; then
    print_status "✅ Backend is running"
else
    print_error "❌ Backend is not running"
fi

if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

# Print access information
echo ""
print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   Local Network URL: http://$SERVER_IP"
echo "   Backend API: http://$SERVER_IP/api"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: pm2 logs"
echo "   Restart app: pm2 restart kaynes-backend"
echo "   Monitor: pm2 monit"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Test the application on different devices in your network"
echo "   2. Run 'sudo mysql_secure_installation' to secure MySQL"
echo "   3. Update passwords in /opt/kaynes-vcard/backend/.env"
echo "   4. Test all features: login, card creation, viewing, etc."
echo ""
print_status "Ready for testing! 🚀"
