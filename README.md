# Find Energy Rates - Multi-Source Energy Rate Database

A comprehensive web application for exploring and analyzing electricity rate data from multiple sources including PowerSetter, ChooseEnergy, and ElectricityRates. Built with React, TypeScript, and Supabase.

## 🚀 Features

- **Multi-Source Data Analysis**: Compare electricity rates from PowerSetter, ChooseEnergy, and ElectricityRates
- **Advanced Filtering**: Filter by data source, utility, ZIP code, green energy options
- **Real-time Dashboard**: Overview of all energy data with statistics and recent activity
- **Price to Compare (PTC) Integration**: Compare rates against official utility baselines
- **Data Export**: Export filtered data as CSV for further analysis
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 📋 System Requirements

### Minimum Server Specifications

#### Production Environment
- **CPU**: 2 vCPU cores (2.4 GHz or higher)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 20 GB SSD minimum, 50 GB recommended
- **Network**: 100 Mbps connection
- **Operating System**: Ubuntu 20.04 LTS or newer, CentOS 8+, or similar Linux distribution

#### Development Environment
- **CPU**: 1 vCPU core (2.0 GHz or higher)
- **RAM**: 2 GB minimum, 4 GB recommended
- **Storage**: 10 GB available space
- **Network**: Stable internet connection for package downloads

### Software Requirements

#### Core Dependencies
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control and deployment

#### Database
- **Supabase**: Cloud PostgreSQL database (recommended)
- **PostgreSQL**: Version 13+ if self-hosting database

#### Web Server (Production)
- **Nginx**: Version 1.18+ (recommended)
- **Apache**: Version 2.4+ (alternative)
- **PM2**: For Node.js process management

#### SSL Certificate (Production)
- **Let's Encrypt**: Free SSL certificates (recommended)
- **Cloudflare**: For CDN and SSL (alternative)

## 🛠️ Installation & Setup

### 1. Server Preparation

#### Ubuntu/Debian Systems
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional dependencies
sudo apt-get install -y git nginx certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version  # Should be 18.x or higher
npm --version   # Should be 8.x or higher
```

#### CentOS/RHEL Systems
```bash
# Update system packages
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install additional dependencies
sudo yum install -y git nginx certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Application Deployment

#### Clone and Setup Application
```bash
# Create application directory
sudo mkdir -p /var/www/find-energy-rates
sudo chown $USER:$USER /var/www/find-energy-rates

# Clone repository
cd /var/www/find-energy-rates
git clone <your-repository-url> .

# Install dependencies
npm install

# Build application
npm run build
```

#### Environment Configuration
```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Custom API endpoints
VITE_API_BASE_URL=https://your-domain.com/api
```

### 3. Database Setup (Supabase)

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project URL and anon key
4. Run the provided SQL migrations in the SQL Editor

#### Database Migrations
```sql
-- Run these in Supabase SQL Editor in order:
-- 1. supabase/migrations/20250617145843_jolly_feather.sql
-- 2. supabase/migrations/20250617160333_green_hat.sql
-- 3. supabase/migrations/20250617174105_delicate_recipe.sql
-- 4. supabase/migrations/20250617182111_fierce_boat.sql
-- 5. supabase/migrations/20250617192916_copper_cave.sql
```

### 4. Web Server Configuration

#### Nginx Configuration
```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/find-energy-rates
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/find-energy-rates/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/find-energy-rates /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL Certificate Setup
```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Add auto-renewal to crontab
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Process Management with PM2

#### PM2 Configuration
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'find-energy-rates',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    cwd: '/var/www/find-energy-rates',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Create logs directory
mkdir -p /var/www/find-energy-rates/logs

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor application
pm2 status
pm2 logs find-energy-rates
```

## 🔧 Configuration Options

### Performance Tuning

#### Nginx Optimization
```nginx
# Add to nginx.conf or site configuration
worker_processes auto;
worker_connections 1024;

# Enable HTTP/2
listen 443 ssl http2;

# Optimize buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;
```

#### PM2 Cluster Mode (for high traffic)
```javascript
module.exports = {
  apps: [{
    name: 'find-energy-rates',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    // ... other options
  }]
}
```

### Security Configuration

#### Firewall Setup (UFW)
```bash
# Enable firewall
sudo ufw enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

#### Additional Security Headers
```nginx
# Add to nginx server block
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;" always;
```

## 📊 Monitoring & Maintenance

### Log Management
```bash
# View application logs
pm2 logs find-energy-rates

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Rotate logs
sudo logrotate -f /etc/logrotate.d/nginx
```

### Health Checks
```bash
# Check application status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### Backup Strategy
```bash
# Create backup script
nano /home/backup-app.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/backups"
APP_DIR="/var/www/find-energy-rates"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 backups
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: app_backup_$DATE.tar.gz"
```

```bash
# Make executable and add to crontab
chmod +x /home/backup-app.sh
crontab -e
# Add: 0 2 * * * /home/backup-app.sh
```

## 🚀 Deployment Automation

### Automated Deployment Script
```bash
# Create deployment script
nano /home/deploy.sh
```

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/find-energy-rates"
BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment..."

# Create backup
echo "📦 Creating backup..."
tar -czf $BACKUP_DIR/pre_deploy_$DATE.tar.gz -C $APP_DIR .

# Pull latest changes
echo "📥 Pulling latest changes..."
cd $APP_DIR
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build application
echo "🔨 Building application..."
npm run build

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart find-energy-rates

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
```

### CI/CD with GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/find-energy-rates
          /home/deploy.sh
```

## 🔍 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs find-energy-rates

# Check if port is in use
sudo netstat -tulpn | grep :3000

# Restart PM2
pm2 restart find-energy-rates
```

#### Database Connection Issues
```bash
# Check environment variables
cat .env

# Test database connection
curl -X GET "https://your-project.supabase.co/rest/v1/powersetter?select=count" \
  -H "apikey: your-anon-key"
```

#### Nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout | grep "Not After"
```

### Performance Issues

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart PM2 if needed
pm2 restart find-energy-rates
```

#### Slow Database Queries
- Check Supabase dashboard for query performance
- Review database indexes
- Consider upgrading Supabase plan for better performance

## 📞 Support

### Getting Help
- Check the troubleshooting section above
- Review application logs: `pm2 logs find-energy-rates`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify environment variables are correctly set

### Useful Commands
```bash
# Application management
pm2 status                    # Check PM2 status
pm2 restart find-energy-rates # Restart application
pm2 logs find-energy-rates    # View logs

# Server management
sudo systemctl status nginx   # Check nginx status
sudo systemctl reload nginx   # Reload nginx config
df -h                         # Check disk space
free -h                       # Check memory usage

# SSL management
sudo certbot certificates     # List certificates
sudo certbot renew           # Renew certificates
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This application requires a Supabase database with the provided schema. Make sure to run all migration files in order and configure your environment variables correctly.