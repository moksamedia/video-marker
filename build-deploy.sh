#!/bin/bash

# Video Markup - Build for Deployment
# This script creates a production-ready build in the /dist directory

set -e  # Exit on error

echo "🚀 Video Markup - Building for Deployment"
echo "=========================================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist
mkdir -p dist

# Build frontend
echo ""
echo "📦 Building Quasar frontend..."
cd frontend-quasar
npm install
npm run build

# Copy built frontend to dist
echo ""
echo "📁 Copying frontend files..."
cd ..
cp -r frontend-quasar/dist/spa/* dist/

# Copy server files
echo "📁 Copying server files..."
mkdir -p dist/server
cp -r server/api dist/server/
cp server/config.php dist/server/

# Create .htaccess
echo "📝 Creating .htaccess..."
cat > dist/.htaccess << 'HTACCESS'
# Enable rewriting
RewriteEngine On
RewriteBase /

# Force HTTPS (uncomment in production)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routes - send to server/api/index.php
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ server/api/index.php/$1 [L,QSA]

# Frontend routes - send everything else to index.html
# But skip actual files/directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L,QSA]

# Deny access to sensitive files
<FilesMatch "(^\.env|config\.php|\.sqlite)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
</IfModule>
HTACCESS

# Create deployment instructions
echo "📝 Creating deployment instructions..."
cat > dist/DEPLOY_INSTRUCTIONS.txt << 'INSTRUCTIONS'
==============================================
Video Markup - Deployment Instructions
==============================================

BEFORE UPLOADING:

1. Edit server/config.php:
   - Set BASE_URL to your domain (e.g., 'https://yourdomain.com/')
   - Set ALLOWED_ORIGINS if needed

2. Review .htaccess:
   - Uncomment HTTPS redirect if using SSL (recommended)

UPLOAD TO YOUR HOST:

Upload ALL files from this directory to your web root (public_html):

Required structure:
  public_html/
  ├── index.html
  ├── .htaccess
  ├── assets/
  ├── icons/
  ├── favicon.ico
  └── server/
      ├── api/
      └── config.php

SET PERMISSIONS:

Directories: 755
  - public_html/
  - public_html/server/
  - public_html/server/api/
  - public_html/assets/

Files: 644
  - .htaccess
  - index.html
  - server/config.php
  - server/api/index.php

Auto-created (on first run):
  - database.sqlite → 644 (or 666 if write issues)
  - audio/ → 755 (or 777 if write issues)

VERIFY DEPLOYMENT:

1. Visit: https://yourdomain.com
   Should see the home page

2. Test API: https://yourdomain.com/api/sessions
   Should return [] or JSON response

3. Create a test session to verify everything works

For detailed instructions, see PHP_DEPLOY.md in the project repository.
INSTRUCTIONS

# Create README in dist
cat > dist/README.txt << 'README'
This directory contains a production-ready build of Video Markup.

Files included:
- Frontend (HTML, JS, CSS, assets)
- PHP backend (/server directory)
- .htaccess for Apache routing
- DEPLOY_INSTRUCTIONS.txt - Read this first!

Before uploading to your host:
1. Edit server/config.php with your domain
2. Read DEPLOY_INSTRUCTIONS.txt
3. Upload all files to your web root
4. Set proper file permissions
5. Test the deployment

Database and audio files will be auto-created on first use.

Need help? See PHP_DEPLOY.md in the main repository.
README

# Calculate sizes
echo ""
echo "📊 Build statistics:"
FRONTEND_SIZE=$(du -sh dist/assets 2>/dev/null | cut -f1)
SERVER_SIZE=$(du -sh dist/server 2>/dev/null | cut -f1)
TOTAL_SIZE=$(du -sh dist 2>/dev/null | cut -f1)

echo "  - Frontend assets: $FRONTEND_SIZE"
echo "  - Server files: $SERVER_SIZE"
echo "  - Total size: $TOTAL_SIZE"

# Count files
FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
echo "  - Total files: $FILE_COUNT"

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Deployment files are in: ./dist"
echo ""
echo "Next steps:"
echo "  1. Edit dist/server/config.php with your domain"
echo "  2. Read dist/DEPLOY_INSTRUCTIONS.txt"
echo "  3. Upload dist/* to your web host"
echo ""
echo "For detailed instructions, see PHP_DEPLOY.md"
echo ""
