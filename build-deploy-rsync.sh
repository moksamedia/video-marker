#!/bin/bash

# Video Markup - Build and Deploy with rsync/FTP
# This script builds and optionally deploys via rsync (fast) or FTP (fallback)

# ============================================
# Configuration
# ============================================
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-videomark.learntibetanlanguage.org}"

# SSH/rsync configuration (faster, recommended)
SSH_HOST="${SSH_HOST:-moksamedia.com}"
SSH_USER="${SSH_USER:-moksamed}"
SSH_PORT="${SSH_PORT:-17177}"
SSH_REMOTE_DIR="${SSH_REMOTE_DIR:-/home/moksamed/$DEPLOY_DOMAIN}"

# FTP configuration (fallback for shared hosting without SSH)
FTP_HOST="${FTP_HOST:-ftp.moksamedia.com}"
FTP_USERNAME="${FTP_USERNAME:-videomark@videomark.learntibetanlanguage.org}"
FTP_REMOTE_DIR="/"

# Parse command line arguments
DEPLOY_METHOD=""
DEPLOY_PASSWORD=""

# Manual parsing to support optional password for -r
while [[ $# -gt 0 ]]; do
  case $1 in
    -r)
      DEPLOY_METHOD="rsync"
      # Check if next argument exists and doesn't start with -
      if [[ -n "$2" && "$2" != -* ]]; then
        DEPLOY_PASSWORD="$2"
        shift
      fi
      shift
      ;;
    -p)
      DEPLOY_METHOD="ftp"
      if [[ -n "$2" && "$2" != -* ]]; then
        DEPLOY_PASSWORD="$2"
        shift
      else
        echo "❌ Error: -p requires a password argument" >&2
        exit 1
      fi
      shift
      ;;
    -h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  -r [PASSWORD]  Deploy via rsync/SSH (fast, recommended)"
      echo "                 Password optional if using SSH key authentication"
      echo "  -p PASSWORD    Deploy via FTP (slower, for basic hosting)"
      echo "  -h             Show this help"
      echo ""
      echo "Environment variables:"
      echo "  DEPLOY_DOMAIN  Target domain (default: videomark.learntibetanlanguage.org)"
      echo "  SSH_USER       SSH username (default: moksamed)"
      echo "  SSH_HOST       SSH host (default: moksamedia.com)"
      echo "  SSH_PORT       SSH port (default: 17177)"
      echo "  SSH_REMOTE_DIR Remote directory (default: /home/moksamed/\$DEPLOY_DOMAIN)"
      echo "  FTP_USERNAME   FTP username"
      echo ""
      echo "Examples:"
      echo "  # Build only:"
      echo "  ./build-deploy-rsync.sh"
      echo ""
      echo "  # Build and deploy via rsync with SSH key (recommended):"
      echo "  ./build-deploy-rsync.sh -r"
      echo ""
      echo "  # Build and deploy via rsync with password:"
      echo "  ./build-deploy-rsync.sh -r YOUR_SSH_PASSWORD"
      echo ""
      echo "  # Build and deploy via FTP:"
      echo "  ./build-deploy-rsync.sh -p YOUR_FTP_PASSWORD"
      echo ""
      echo "  # Custom domain:"
      echo "  DEPLOY_DOMAIN=example.com ./build-deploy-rsync.sh -r"
      exit 0
      ;;
    *)
      echo "❌ Error: Unknown option: $1" >&2
      echo "Use -h for help"
      exit 1
      ;;
  esac
done

set -e  # Exit on error

echo "🚀 Video Markup - Building for Deployment"
echo "=========================================="
echo "Target domain: $DEPLOY_DOMAIN"
if [ -n "$DEPLOY_METHOD" ]; then
  echo "Deploy method: $DEPLOY_METHOD"
fi
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
cat > dist/DEPLOY_INSTRUCTIONS.txt << INSTRUCTIONS
==============================================
Video Markup - Deployment Instructions
==============================================

Target Domain: $DEPLOY_DOMAIN

BEFORE UPLOADING:

1. Edit server/config.php:
   - Set BASE_URL to 'https://$DEPLOY_DOMAIN/'
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

1. Visit: https://$DEPLOY_DOMAIN
   Should see the home page

2. Test API: https://$DEPLOY_DOMAIN/api/sessions
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
echo "🌐 Target domain: $DEPLOY_DOMAIN"
echo ""

# Deploy if method specified
if [ "$DEPLOY_METHOD" = "rsync" ]; then
  echo "📤 Deploying via rsync (fast, efficient)..."
  echo "   Host: $SSH_HOST"
  echo "   User: $SSH_USER"
  echo "   Port: $SSH_PORT"
  echo "   Remote directory: $SSH_REMOTE_DIR"
  echo ""

  # Check if password was provided
  if [ -n "$DEPLOY_PASSWORD" ]; then
    # Password provided - use sshpass
    if command -v sshpass &> /dev/null; then
      echo "Using rsync with password authentication..."
      sshpass -p "$DEPLOY_PASSWORD" rsync -avz --delete \
        -e "ssh -p $SSH_PORT -o StrictHostKeyChecking=no" \
        dist/ "$SSH_USER@$SSH_HOST:$SSH_REMOTE_DIR"
    else
      echo "❌ Password provided but sshpass not found."
      echo "   Install sshpass for password-based authentication:"
      echo "   macOS: brew install hudochenkov/sshpass/sshpass"
      echo "   Linux: apt-get install sshpass or yum install sshpass"
      exit 1
    fi
  else
    # No password - use SSH key authentication
    echo "Using rsync with SSH key authentication..."
    rsync -avz --delete \
      -e "ssh -p $SSH_PORT -o StrictHostKeyChecking=no" \
      dist/ "$SSH_USER@$SSH_HOST:$SSH_REMOTE_DIR"
  fi

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Your app should now be live at: https://$DEPLOY_DOMAIN"
  else
    echo ""
    echo "❌ Rsync deployment failed!"
    exit 1
  fi

elif [ "$DEPLOY_METHOD" = "ftp" ]; then
  echo "📤 Deploying via FTP..."
  echo "   Host: $FTP_HOST"
  echo "   User: $FTP_USERNAME"
  echo "   Remote directory: $FTP_REMOTE_DIR"
  echo ""

  # Check if lftp is available (better for recursive uploads)
  if command -v lftp &> /dev/null; then
    echo "Using lftp for deployment..."
    lftp -c "
      set ssl:verify-certificate no;
      open -u $FTP_USERNAME,$DEPLOY_PASSWORD $FTP_HOST;
      cd $FTP_REMOTE_DIR;
      mirror -R --verbose dist/ ./;
      quit
    "

    if [ $? -eq 0 ]; then
      echo ""
      echo "✅ Deployment successful!"
      echo "🌐 Your app should now be live at: https://$DEPLOY_DOMAIN"
    else
      echo ""
      echo "❌ FTP upload failed!"
      exit 1
    fi
  else
    echo "⚠️  lftp not found. For best results, install it:"
    echo "   macOS: brew install lftp"
    echo "   Linux: apt-get install lftp or yum install lftp"
    echo ""
    echo "Falling back to basic ftp (may not upload all nested directories)..."
    echo ""

    # Basic FTP upload (limited)
    ftp -n $FTP_HOST << FTPEOF
user $FTP_USERNAME $DEPLOY_PASSWORD
binary
cd $FTP_REMOTE_DIR
lcd dist
prompt off
mput *
bye
FTPEOF

    if [ $? -eq 0 ]; then
      echo ""
      echo "⚠️  Basic FTP upload complete, but may be incomplete"
      echo "   Install lftp for full recursive deployment"
      echo ""
      echo "🌐 Check: https://$DEPLOY_DOMAIN"
    else
      echo ""
      echo "❌ FTP upload failed!"
      exit 1
    fi
  fi

else
  # No deployment method specified - show manual instructions
  echo "Next steps:"
  echo "  1. Edit dist/server/config.php and set BASE_URL to 'https://$DEPLOY_DOMAIN/'"
  echo "  2. Read dist/DEPLOY_INSTRUCTIONS.txt"
  echo "  3. Upload dist/* to your web host"
  echo ""
  echo "For detailed instructions, see PHP_DEPLOY.md"
  echo ""
  echo "💡 Quick deployment options:"
  echo ""
  echo "   rsync with SSH key (fast, recommended):"
  echo "   ./build-deploy-rsync.sh -r"
  echo ""
  echo "   rsync with password:"
  echo "   ./build-deploy-rsync.sh -r YOUR_SSH_PASSWORD"
  echo ""
  echo "   FTP (slower, works on basic shared hosting):"
  echo "   ./build-deploy-rsync.sh -p YOUR_FTP_PASSWORD"
  echo ""
  echo "   Use -h for more options and help"
fi

echo ""
