# Deployment Guide

## VS Code SFTP Extension Deployment

### Setup

1. **Install the SFTP extension**:
   - Open VS Code Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "SFTP" by Natizyskunk
   - Install the extension
   - Marketplace: https://marketplace.visualstudio.com/items?itemName=Natizyskunk.sftp

2. **Create configuration** (if `.vscode/sftp.json` doesn't exist):
   - Copy `.vscode/sftp.json.example` to `.vscode/sftp.json`
   - Or run: `cp .vscode/sftp.json.example .vscode/sftp.json`

3. **Configure authentication**:

   **Option A - SSH Key (Recommended)**:
   - The default profile uses SSH key authentication
   - Ensure your SSH key is at `~/.ssh/id_rsa`
   - No password required

   **Option B - FTP with Password**:
   - Switch to FTP profile: `Ctrl+Shift+P` → `SFTP: Set Profile` → Select "ftp"
   - Edit `.vscode/sftp.json` and replace `YOUR_FTP_PASSWORD_HERE` with your actual FTP password

4. **Test the connection** (optional):
   ```bash
   npm install
   npm run test-ftp
   ```

   This will verify your FTP credentials and show files on the remote server.

5. **Build the project**:
   ```bash
   cd frontend-quasar
   npm run build
   cd ..
   ```

   This creates the `dist` folder at the project root containing:
   - Frontend build files
   - Server PHP files
   - `.htaccess` configuration

### Deployment Commands

1. **Upload dist folder**:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run: `SFTP: Upload Folder`
   - Select the `dist` folder

2. **Upload entire project** (uploads only dist folder based on context):
   - Command Palette → `SFTP: Upload Project`

3. **Sync local to remote**:
   - Command Palette → `SFTP: Sync Local -> Remote`

4. **View remote files**:
   - View → Show SFTP (opens Remote Explorer)
   - Browse files on the server

### Configuration Profiles

The configuration includes two profiles:

- **sftp** (default): SSH/SFTP connection on port 17177
- **ftp**: Standard FTP connection on port 21 with TLS

Switch profiles: `SFTP: Set Profile` command

### Quick Deploy Workflow

1. Make your changes
2. Build:
   ```bash
   cd frontend-quasar
   npm run build
   cd ..
   ```
3. Upload: `SFTP: Upload Folder` → Select `dist`
4. Done!

### Testing FTP Connection

A test script is provided to verify your FTP credentials before deployment:

```bash
npm install
npm run test-ftp
```

**What it does**:
- Reads connection settings from `.vscode/sftp.json`
- Tests FTP connection with your credentials
- Lists files in the remote directory
- Shows detailed error messages if connection fails

**Example output**:
```
🔍 Reading SFTP configuration...

📋 Configuration:
   Host: moksamedia.com
   Port: 21
   Username: moksamed
   Password: ***
   Secure (TLS): Yes
   Remote Path: /home/moksamed/videomark.learntibetanlanguage.org

🔌 Connecting to FTP server...

✅ Successfully connected to FTP server!

📂 Listing remote directory: /home/moksamed/videomark.learntibetanlanguage.org
   Found 12 items:

   📁 api
   📁 assets
   📄 index.html (3.2 KB)
   ...

✅ FTP connection test successful!
```

### Troubleshooting

**View logs**:
- File → Preferences → Settings
- Set `sftp.debug` to `true`
- View → Output → Select "sftp" from dropdown

**Common Issues**:
- SSH key not found: Update `privateKeyPath` in `.vscode/sftp.json`
- Permission denied: Verify username and credentials
- Connection timeout: Check host, port, and firewall settings

### Alternative: Command Line Deployment

If you prefer command line deployment, use the existing scripts:

**SFTP/rsync** (recommended):
```bash
./build-deploy-rsync.sh -r
```

**FTP**:
```bash
./build-deploy-rsync.sh -p YOUR_FTP_PASSWORD
```

**Options**:
- `--frontend-only`: Deploy only frontend changes
- `--server-only`: Deploy only backend changes
- `--clean`: Overwrite database and audio files (fresh start)

See `build-deploy-rsync.sh` for more options.

## What Gets Deployed

The `dist` folder contains:
- **Frontend**: Quasar build output (HTML, JS, CSS, assets)
- **Server**: PHP backend files (`api/`, `config.php`)
- **Configuration**: `.htaccess` for routing
- **Audio**: Directory for uploaded audio files (preserved on deployment)
- **Database**: SQLite database file (preserved on deployment)

## Production Server Structure

```
/home/moksamed/videomark.learntibetanlanguage.org/
├── api/                    # PHP backend
│   ├── endpoints/         # API handlers
│   └── lib/               # Database, auth
├── audio/                 # Uploaded audio files
├── assets/                # Frontend static assets
├── css/                   # Frontend styles
├── js/                    # Frontend JavaScript
├── index.html             # Frontend entry point
├── .htaccess              # Apache routing
├── config.php             # Backend configuration
└── database.sqlite        # SQLite database
```
