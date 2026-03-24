#!/bin/bash

# Kaynes Digital Card - Global Deployment Script
# Run this script after local testing is complete

set -e  # Exit on any error

echo "🌍 Starting Kaynes Digital Card Global Deployment..."

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

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <your-domain.com>"
    print_error "Example: $0 kaynes-vcard.com"
    exit 1
fi

DOMAIN=$1
print_status "Deploying for domain: $DOMAIN"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
print_status "Server IP: $SERVER_IP"

# Step 1: Install Certbot for SSL
print_status "Installing SSL certificate tools..."

sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Step 2: Update Nginx configuration for domain
print_status "Updating Nginx configuration for domain..."

sudo tee /etc/nginx/sites-available/kaynes-vcard > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

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

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx

print_status "Nginx configuration updated"

# Step 3: Obtain SSL Certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."

sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

print_status "SSL certificate installed successfully"

# Step 4: Update backend configuration for HTTPS
print_status "Updating backend configuration for HTTPS..."

cd /opt/kaynes-vcard/backend

# Update .env file
sed -i "s|CORS_ORIGIN=http://$SERVER_IP|CORS_ORIGIN=https://$DOMAIN|g" .env

# Update frontend API calls
cd /opt/kaynes-vcard/frontend/src/pages
sed -i "s|http://$SERVER_IP:5000/api|https://$DOMAIN/api|g" CardView.js

# Rebuild frontend
cd /opt/kaynes-vcard/frontend
npm run build

print_status "Frontend rebuilt with HTTPS URLs"

# Step 5: Restart services
print_status "Restarting services..."

pm2 restart kaynes-backend
sudo systemctl reload nginx

print_status "Services restarted"

# Step 6: Setup automatic SSL renewal
print_status "Setting up automatic SSL renewal..."

# Create renewal script
sudo tee /etc/cron.daily/ssl-renewal > /dev/null << EOF
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
EOF

sudo chmod +x /etc/cron.daily/ssl-renewal

print_status "Automatic SSL renewal configured"

# Step 7: Setup monitoring
print_status "Setting up basic monitoring..."

# Create monitoring script
cat > /opt/kaynes-vcard/monitor.sh << 'EOF'
#!/bin/bash

# Basic monitoring script
echo "=== Kaynes VCard System Status ==="
echo "Date: $(date)"
echo ""

# Check PM2 processes
echo "PM2 Status:"
pm2 list
echo ""

# Check Nginx status
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""

# Check disk usage
echo "Disk Usage:"
df -h
echo ""

# Check memory usage
echo "Memory Usage:"
free -h
echo ""

# Check SSL certificate
echo "SSL Certificate Status:"
sudo certbot certificates
echo ""
EOF

chmod +x /opt/kaynes-vcard/monitor.sh

print_status "Monitoring script created"

# Step 8: Create backup script
print_status "Setting up backup system..."

# Create backup directory
sudo mkdir -p /backup/kaynes-vcard

# Create backup script
cat > /opt/kaynes-vcard/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backup/kaynes-vcard"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
mysqldump -u kaynes_user -p$(grep DB_PASSWORD /opt/kaynes-vcard/backend/.env | cut -d'=' -f2) kaynes_vcard > $BACKUP_DIR/database_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt kaynes-vcard

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/kaynes-vcard/backup.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/kaynes-vcard/backup.sh") | crontab -

print_status "Backup system configured"

# Step 9: Final checks
print_status "Performing final checks..."

# Check SSL certificate
if sudo certbot certificates | grep -q "$DOMAIN"; then
    print_status "✅ SSL certificate is valid"
else
    print_error "❌ SSL certificate issue detected"
fi

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

# Print final information
echo ""
print_status "🎉 Global deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   Production URL: https://$DOMAIN"
echo "   API Endpoint: https://$DOMAIN/api"
echo "   Backup Location: /backup/kaynes-vcard"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: pm2 logs"
echo "   Monitor system: /opt/kaynes-vcard/monitor.sh"
echo "   Manual backup: /opt/kaynes-vcard/backup.sh"
echo "   Restart app: pm2 restart kaynes-backend"
echo "   SSL renewal: sudo certbot renew"
echo ""
echo "📊 Monitoring:"
echo "   - SSL certificate auto-renews every 60 days"
echo "   - Daily backups at 2 AM"
echo "   - PM2 auto-restarts on crashes"
echo ""
echo "🌍 Your application is now live globally!"
print_status "Ready for production use! 🚀"
