#!/usr/bin/env node

/**
 * Simple FTP connection test script
 * Reads .vscode/sftp.json and tests the FTP connection
 */

const fs = require('fs');
const ftp = require('basic-ftp');
const path = require('path');

async function testFTPConnection() {
  console.log('🔍 Reading SFTP configuration...\n');

  // Read sftp.json
  const configPath = path.join(__dirname, '.vscode', 'sftp.json');

  if (!fs.existsSync(configPath)) {
    console.error('❌ Error: .vscode/sftp.json not found!');
    console.error('   Please create it from .vscode/sftp.json.example\n');
    process.exit(1);
  }

  let config;
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('❌ Error parsing sftp.json:', error.message);
    process.exit(1);
  }

  // Get FTP profile settings
  const ftpProfile = config.profiles?.ftp || {};
  const host = config.host;
  const port = config.port || 21;
  const username = config.username;
  const password = config.password;
  const secure = false;
  const remotePath = config.remotePath || '/';

  console.log('📋 Configuration:');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password ? '***' : '[NOT SET]'}`);
  console.log(`   Secure (TLS): ${secure ? 'Yes' : 'No'}`);
  console.log(`   Remote Path: ${remotePath}\n`);

  if (!password || password === 'YOUR_FTP_PASSWORD_HERE') {
    console.error('❌ Error: FTP password not set in sftp.json!');
    console.error('   Please edit .vscode/sftp.json and set the password in profiles.ftp.password\n');
    process.exit(1);
  }

  console.log('🔌 Connecting to FTP server...\n');

  const client = new ftp.Client();
  client.ftp.verbose = true; // Show detailed logs

  try {
    await client.access({
      host: host,
      port: port,
      user: username,
      password: password,
      secure: secure,
      secureOptions: {
        rejectUnauthorized: false // Accept self-signed certificates
      }
    });

    console.log('\n✅ Successfully connected to FTP server!\n');

    // Try to list remote directory
    console.log(`📂 Listing remote directory: ${remotePath}`);
    const files = await client.list(remotePath);

    console.log(`\n   Found ${files.length} items:\n`);
    files.slice(0, 10).forEach(file => {
      const type = file.isDirectory ? '📁' : '📄';
      const size = file.isDirectory ? '' : ` (${formatSize(file.size)})`;
      console.log(`   ${type} ${file.name}${size}`);
    });

    if (files.length > 10) {
      console.log(`   ... and ${files.length - 10} more items`);
    }

    console.log('\n✅ FTP connection test successful!\n');

    client.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ FTP connection failed!');
    console.error(`   Error: ${error.message}\n`);

    if (error.code === 'ENOTFOUND') {
      console.error('   💡 Tip: Check if the host is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Tip: Check if the port is correct and FTP service is running');
    } else if (error.code === 530) {
      console.error('   💡 Tip: Check username and password');
    }

    client.close();
    process.exit(1);
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Run the test
testFTPConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
