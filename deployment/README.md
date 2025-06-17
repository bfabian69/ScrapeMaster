# Deploying ScrapeMaster to Hostinger VPS

This guide will help you deploy your React application to a Hostinger VPS server.

## Prerequisites

- Hostinger VPS with SSH access
- Node.js 18+ installed on your VPS
- Domain name (optional, but recommended)
- Basic knowledge of Linux commands

## Deployment Options

### Option 1: Static File Deployment (Recommended)

This is the simplest approach - build the app locally and upload the static files.

#### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist` folder with all static files.

#### Step 2: Upload to VPS

You can use any of these methods:

**Method A: Using SCP/SFTP**
```bash
# Upload the dist folder to your VPS
scp -r dist/* username@your-vps-ip:/var/www/html/
```

**Method B: Using FileZilla or similar FTP client**
- Connect to your VPS via SFTP
- Upload contents of `dist` folder to `/var/www/html/` or your web root

**Method C: Using rsync**
```bash
rsync -avz dist/ username@your-vps-ip:/var/www/html/
```

#### Step 3: Configure Web Server

**For Apache:**
Create `.htaccess` file in your web root:

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

**For Nginx:**
Add this to your server block:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Option 2: Full VPS Setup with PM2

This approach runs the development server on your VPS (not recommended for production).

#### Step 1: Connect to Your VPS

```bash
ssh username@your-vps-ip
```

#### Step 2: Install Node.js and PM2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

#### Step 3: Clone/Upload Your Project

```bash
# Create project directory
mkdir -p /var/www/scrapemaster
cd /var/www/scrapemaster

# Upload your project files here
# You can use git clone, scp, or FTP
```

#### Step 4: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

#### Step 5: Serve with PM2

Create a PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add this configuration:

```javascript
module.exports = {
  apps: [{
    name: 'scrapemaster',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    cwd: '/var/www/scrapemaster',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

Start the application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Docker Deployment

If your VPS supports Docker:

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Build and Run

```bash
# Build image
docker build -t scrapemaster .

# Run container
docker run -d -p 80:80 --name scrapemaster scrapemaster
```

## Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://prqopoqgwrryocbupwcc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycW9wb3Fnd3JyeW9jYnVwd2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzEwNTAsImV4cCI6MjA2NTc0NzA1MH0.QEMuPZVn_maMpP-KOycNI8MgvNICukrxNZsuXMjGAPE
```

## SSL Certificate (Recommended)

For production, set up SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Log Monitoring
```bash
# PM2 logs (if using PM2)
pm2 logs scrapemaster

# Apache logs
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart PM2 (if using)
pm2 restart scrapemaster

# Or re-upload static files
```

## Troubleshooting

### Common Issues

1. **404 errors on refresh**: Make sure your web server is configured for client-side routing
2. **Environment variables not working**: Ensure `.env` file is in the project root and variables start with `VITE_`
3. **Build fails**: Check Node.js version (needs 18+)
4. **Supabase connection issues**: Verify your environment variables and network connectivity

### Performance Optimization

1. **Enable Gzip compression** in your web server
2. **Set proper cache headers** for static assets
3. **Use a CDN** for better global performance
4. **Monitor resource usage** with `htop` or similar tools

## Security Considerations

1. **Keep your VPS updated**: `sudo apt update && sudo apt upgrade`
2. **Configure firewall**: Only allow necessary ports (80, 443, 22)
3. **Use strong passwords** and consider SSH key authentication
4. **Regular backups** of your application and data
5. **Monitor logs** for suspicious activity

## Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set correctly
3. Ensure your VPS has sufficient resources (RAM, disk space)
4. Test locally first to isolate VPS-specific issues