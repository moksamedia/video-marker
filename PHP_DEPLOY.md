# Deploying Video Markup to Shared Hosting (PHP)

This guide explains how to deploy the Video Markup app to a typical shared hosting provider like FastComet, Bluehost, HostGator, or similar services that support PHP and SQLite.

## Prerequisites

**On Your Hosting Account:**
- PHP 8.0 or higher
- SQLite3 extension enabled (usually enabled by default)
- File upload permissions
- .htaccess support (Apache with mod_rewrite)

**On Your Local Machine:**
- Node.js 18+ (for building the frontend)
- FTP/SFTP client (FileZilla, Cyberduck, or cPanel File Manager)

---

## Quick Start: Automated Build

**Easiest method:** Use the provided build script to create a deployment-ready package:

```bash
./build-deploy.sh
```

This script will:
- Build the Quasar frontend
- Copy all necessary files to `./dist/`
- Generate `.htaccess` with optimized settings
- Create deployment instructions

Then simply:
1. Edit `dist/server/config.php` with your domain
2. Upload `dist/*` to your web host
3. Set file permissions as instructed

**Want to build manually?** Continue with the detailed steps below.

---

## Deployment Steps (Manual)

### 1. Build the Frontend

On your local machine, build the Quasar frontend for production:

```bash
cd frontend-quasar
npm install
npm run build
```

This creates a `dist/spa` directory with the compiled frontend files.

### 2. Prepare Files for Upload

You need to upload these files/directories to your hosting:

**Required Files:**
```
/server/                 # Entire server directory
  ├── api/               # API endpoints
  ├── config.php         # Configuration file
  └── router.php         # Dev router (not needed for production)
/.htaccess               # URL rewriting rules (create this)
/frontend-quasar/dist/spa/  # Built frontend (will be renamed)
```

**Files to EXCLUDE (do not upload):**
```
/frontend-quasar/src/    # Source files (not needed)
/frontend-quasar/node_modules/
/frontend/               # Old frontend (if using Quasar)
/frontend-supabase/      # Not needed for PHP backend
/server/router.php       # Only for dev server, not needed on host
/database.sqlite         # Will be auto-created
/audio/                  # Will be auto-created
.git/
.env files
```

### 3. Upload to Your Web Host

#### Option A: Using cPanel File Manager

1. Log into your cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your site's root directory)
4. Upload the files maintaining this structure:

```
public_html/
├── index.html           # From frontend-quasar/dist/spa/
├── assets/              # From frontend-quasar/dist/spa/assets/
├── icons/               # From frontend-quasar/dist/spa/icons/
├── favicon.ico          # From frontend-quasar/dist/spa/
├── server/              # Your PHP backend
│   ├── api/
│   │   ├── endpoints/
│   │   ├── lib/
│   │   └── index.php
│   └── config.php
└── .htaccess
```

#### Option B: Using FTP/SFTP

1. Connect to your host using FTP client (e.g., FileZilla)
2. Navigate to `public_html` or your domain's root
3. Upload files as described above
4. Ensure proper directory structure

### 4. Create .htaccess File

Create or update `.htaccess` in your `public_html` root:

```apache
# Enable rewriting
RewriteEngine On
RewriteBase /

# API routes - send to server/api/index.php
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ server/api/index.php/$1 [L,QSA]

# Frontend routes - send everything else to index.html
# But skip actual files/directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L,QSA]
```

### 5. Configure PHP Settings

Edit `config.php` and set the correct base URL:

```php
<?php
// config.php

// Your domain URL (with trailing slash)
define('BASE_URL', 'https://yourdomain.com/');

// API URL
define('API_URL', BASE_URL . 'api/');

// Database file path (auto-created)
define('DB_FILE', __DIR__ . '/database.sqlite');

// Audio directory path (auto-created)
define('AUDIO_DIR', __DIR__ . '/audio/');

// CORS settings
define('ALLOWED_ORIGINS', [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]);
```

**Important:** Replace `yourdomain.com` with your actual domain name.

### 6. Set File Permissions

Using cPanel File Manager or FTP client, set these permissions:

```
Directories:
- public_html/         → 755
- public_html/server/  → 755
- public_html/server/api/ → 755
- public_html/assets/  → 755

Files:
- .htaccess            → 644
- server/config.php    → 644
- index.html           → 644
- server/api/index.php → 644

Auto-created (will be created on first run):
- database.sqlite      → 644 (or 666 if having write issues)
- audio/               → 755 (or 777 if having write issues)
```

**To set permissions in cPanel:**
1. Right-click the file/folder
2. Select "Change Permissions"
3. Set appropriate values

### 7. Test the Deployment

1. Visit `https://yourdomain.com` in your browser
2. You should see the Video Markup home page
3. Try creating a session:
   - Enter a YouTube URL
   - Click "Create Session"
   - Verify the session loads correctly

### 8. Verify API is Working

Test the API endpoint directly:

```
https://yourdomain.com/api/sessions
```

You should see either:
- An empty JSON array `[]` (if no sessions yet)
- Or a 404 error page (means .htaccess routing is not working)

---

## Troubleshooting

### Issue: "500 Internal Server Error"

**Causes:**
- Incorrect file permissions
- .htaccess syntax errors
- PHP version too old

**Solutions:**
1. Check error logs in cPanel (Error Log viewer)
2. Verify PHP version is 8.0+ in cPanel (PHP Selector)
3. Check .htaccess file for typos
4. Set database directory permissions to 755
5. Ensure SQLite3 extension is enabled

### Issue: "Database error" or "Unable to open database"

**Causes:**
- Directory not writable
- SQLite extension not enabled

**Solutions:**
1. Set parent directory permissions to 755 (or 777 temporarily)
2. In cPanel, go to "Select PHP Version" and enable `sqlite3` extension
3. Create empty `database.sqlite` file manually and set permissions to 666

### Issue: API routes return 404

**Causes:**
- .htaccess not being read
- mod_rewrite not enabled

**Solutions:**
1. Verify .htaccess is in the root directory (not in /api)
2. Check that your hosting supports .htaccess (most do)
3. Contact hosting support to enable mod_rewrite
4. Try adding this to .htaccess:
   ```apache
   Options +FollowSymLinks
   ```

### Issue: Audio uploads fail

**Causes:**
- Audio directory not writable
- PHP upload size limit too small

**Solutions:**
1. Set `/audio` directory permissions to 777
2. Create the directory manually if it doesn't exist
3. Check PHP upload limits in cPanel (PHP Selector):
   - `upload_max_filesize` = 20M or higher
   - `post_max_size` = 20M or higher
   - `max_execution_time` = 300 or higher

### Issue: Frontend shows but is blank/broken

**Causes:**
- Asset paths incorrect
- JavaScript not loading

**Solutions:**
1. Open browser DevTools Console (F12)
2. Look for 404 errors on CSS/JS files
3. Verify all files from `dist/spa` were uploaded
4. Check that `assets/` directory uploaded correctly
5. Clear browser cache and try again

### Issue: YouTube videos won't play

**Causes:**
- YouTube embedding restrictions
- HTTPS required for some videos

**Solutions:**
1. Ensure your site uses HTTPS (enable SSL in cPanel)
2. Some YouTube videos can't be embedded (copyright restrictions)
3. Try a different YouTube video

---

## Security Considerations

### 1. HTTPS/SSL Certificate

**Highly Recommended:** Enable HTTPS using a free Let's Encrypt certificate:

1. In cPanel, go to **SSL/TLS Status**
2. Install certificate for your domain
3. Force HTTPS redirect by adding to .htaccess:

```apache
# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 2. Database Security

The SQLite database is in your public directory, but:
- It's not directly accessible due to file extensions
- Consider moving it outside public_html if possible

**Option: Move database outside public_html:**

1. Edit `config.php`:
   ```php
   define('DB_FILE', '/home/username/private/database.sqlite');
   ```
2. Ensure the directory exists and is writable
3. Update permissions as needed

### 3. Audio Files Security

Audio files are public by design (needed for playback). To add basic protection:

1. Create `/audio/.htaccess`:
   ```apache
   # Prevent directory listing
   Options -Indexes

   # Only allow audio file types
   <FilesMatch "\.(mp3|webm|ogg)$">
       Order Allow,Deny
       Allow from all
   </FilesMatch>

   # Block everything else
   <FilesMatch "^.*$">
       Order Deny,Allow
       Deny from all
   </FilesMatch>
   ```

### 4. Hide Sensitive Files

Add to main .htaccess:

```apache
# Deny access to sensitive files
<FilesMatch "(^\.env|^config\.php|\.sqlite)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

---

## Updating the Application

To update your deployed app:

1. **Pull latest changes** on local machine:
   ```bash
   git pull origin main
   ```

2. **Rebuild frontend**:
   ```bash
   cd frontend-quasar
   npm install  # if package.json changed
   npm run build
   ```

3. **Upload changed files only**:
   - New/modified files from `dist/spa/`
   - Any changed PHP files in `/api`
   - Updated `config.php` if needed

4. **Database migrations**: If schema changed, you may need to:
   - Backup existing `database.sqlite`
   - Delete it (will recreate)
   - Or manually run SQL migrations

---

## Performance Optimization

### 1. Enable Gzip Compression

Add to .htaccess:

```apache
# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### 2. Browser Caching

Add to .htaccess:

```apache
# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
</IfModule>
```

### 3. Optimize PHP Settings

In cPanel PHP Selector or php.ini:

```ini
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 20M
post_max_size = 20M
```

---

## Maintenance

### Backup Your Data

**Regular backups recommended:**

1. **Database**: Download `database.sqlite` via FTP
2. **Audio files**: Download entire `/audio` directory
3. **Schedule**: Weekly or after significant usage

**Using cPanel Backup:**
1. Go to **Backup Wizard**
2. Choose "Full Backup" or "Partial Backup"
3. Download to local machine

### Monitor Disk Space

- Audio files accumulate over time
- Check disk usage in cPanel
- Delete old sessions if needed (through the app or database)

### Check Error Logs

Regularly review PHP error logs:
1. cPanel → **Errors**
2. Look for unusual patterns
3. Fix any recurring issues

---

## Support Resources

- **cPanel Documentation**: https://docs.cpanel.net/
- **FastComet Support**: Contact via their ticket system
- **PHP Documentation**: https://www.php.net/docs.php
- **SQLite Documentation**: https://www.sqlite.org/docs.html

---

## Quick Reference: File Structure on Host

```
public_html/                      (your web root)
├── index.html                    (frontend entry point)
├── .htaccess                     (routing rules)
├── assets/                       (frontend assets)
│   ├── *.js
│   ├── *.css
│   └── ...
├── icons/                        (app icons)
├── server/                       (PHP backend)
│   ├── config.php                (configuration)
│   └── api/                      (API endpoints)
│       ├── index.php             (API router)
│       ├── endpoints/
│       │   ├── sessions.php
│       │   ├── markers.php
│       │   ├── posts.php
│       │   └── audio.php
│       └── lib/
│           ├── db.php
│           └── auth.php
├── database.sqlite               (auto-created)
└── audio/                        (auto-created, writable)
    └── *.mp3
```

---

## Estimated Costs

**Typical Shared Hosting Plans:**
- **FastComet**: $2.95-$9.95/month
- **Bluehost**: $2.95-$13.95/month
- **HostGator**: $2.75-$5.95/month

**What You Get:**
- Unlimited bandwidth (usually)
- 10-50 GB storage
- Free SSL certificate
- cPanel access
- Email accounts
- PHP + MySQL/SQLite support

**Sufficient for:**
- Personal use
- Small groups (10-50 users)
- Moderate usage (100-500 sessions)

**Consider upgrading if:**
- High traffic (thousands of users)
- Large audio file storage (100+ GB)
- Need better performance

---

## Next Steps After Deployment

1. ✅ Test all features (create session, add markers, record audio)
2. ✅ Verify HTTPS is working
3. ✅ Set up regular backups
4. ✅ Share the URL with your language partners
5. ✅ Monitor error logs for first few days
6. ✅ Optimize based on actual usage patterns

---

**Need Help?**
- Check the main [README.md](README.md) for general app documentation
- See [CLAUDE.md](CLAUDE.md) for technical implementation details
- Contact your hosting provider's support for server-specific issues
