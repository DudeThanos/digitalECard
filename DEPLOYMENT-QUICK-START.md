# 🚀 Kaynes Digital Card - Quick Deployment Guide

## 📋 Prerequisites
- Ubuntu/Debian server (20.04 LTS or newer)
- Domain name (for global deployment)
- SSH access to server

## 🔧 Phase 1: Local Network Testing

### Step 1: Prepare Your Server
```bash
# Connect to your server
ssh user@your-server-ip

# Copy deployment files
scp -r kaynesVcard user@your-server-ip:~/
```

### Step 2: Run Local Deployment
```bash
# On your server
cd ~/kaynesVcard
./deploy-local.sh
```

### Step 3: Test Locally
- Access: `http://your-server-ip`
- Test on different devices in your network
- Verify all features work correctly

## 🌍 Phase 2: Global Deployment

### Step 1: Purchase Domain
- Buy domain (e.g., kaynes-vcard.com)
- Point DNS to your server's public IP

### Step 2: Run Global Deployment
```bash
# On your server
cd ~/kaynesVcard
./deploy-global.sh kaynes-vcard.com
```

### Step 3: Test Globally
- Access: `https://kaynes-vcard.com`
- Test from different locations
- Verify SSL certificate

## 📊 Management Commands

### Application Management
```bash
# View logs
pm2 logs

# Restart application
pm2 restart kaynes-backend

# Monitor resources
pm2 monit

# Check status
pm2 status
```

### System Monitoring
```bash
# Check system status
/opt/kaynes-vcard/monitor.sh

# Manual backup
/opt/kaynes-vcard/backup.sh

# Check SSL certificate
sudo certbot certificates
```

### Nginx Management
```bash
# Check Nginx status
sudo systemctl status nginx

# Reload Nginx
sudo systemctl reload nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
```

## 🔒 Security Checklist
- [ ] Strong database passwords
- [ ] JWT secret key updated
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Regular backups enabled
- [ ] Monitoring setup

## 🆘 Troubleshooting

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs kaynes-backend

# Check if port 5000 is in use
sudo netstat -tlnp | grep :5000

# Restart application
pm2 restart kaynes-backend
```

### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiration
sudo certbot certificates | grep "VALID"
```

### Database Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Connect to database
mysql -u kaynes_user -p kaynes_vcard

# Check database tables
SHOW TABLES;
```

## 📞 Support
- Check logs: `pm2 logs` and `/var/log/nginx/error.log`
- Monitor system: `/opt/kaynes-vcard/monitor.sh`
- Backup data: `/opt/kaynes-vcard/backup.sh`

## 🎯 Success Indicators
- ✅ Application accessible via IP/domain
- ✅ SSL certificate valid
- ✅ All features working (login, card creation, viewing)
- ✅ Mobile responsiveness
- ✅ Backup system working
- ✅ Monitoring active

Your Kaynes Digital Card application is now ready for production use! 🚀
