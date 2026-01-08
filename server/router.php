<?php
// Development router for PHP built-in server
// Usage: php -S localhost:8000 server/router.php

$projectRoot = dirname(__DIR__);
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route API requests to api/index.php
if (preg_match('#^/api/#', $uri)) {
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    require __DIR__ . '/api/index.php';
    exit;
}

// Serve audio files (from project root)
if (preg_match('#^/audio/(.+)$#', $uri, $matches)) {
    $filepath = $projectRoot . '/audio/' . basename($matches[1]);
    if (file_exists($filepath)) {
        header('Content-Type: audio/mpeg');
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
        exit;
    }
    http_response_code(404);
    exit;
}

// Serve static files from frontend/dist (for production testing)
if (file_exists($projectRoot . '/frontend/dist' . $uri)) {
    return false; // Let PHP serve the file
}

// For frontend development, return false to let Vite handle it
// For production, serve index.html for all other routes
if (file_exists($projectRoot . '/frontend/dist/index.html') && !preg_match('/\.\w+$/', $uri)) {
    require $projectRoot . '/frontend/dist/index.html';
    exit;
}

return false;
