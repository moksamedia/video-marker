<?php

// Project root is one level up from /server
define('PROJECT_ROOT', dirname(__DIR__));
define('DB_PATH', PROJECT_ROOT . '/database.sqlite');
define('AUDIO_DIR', PROJECT_ROOT . '/audio');
define('MAX_AUDIO_DURATION', 300); // 5 minutes in seconds
define('CORS_ORIGIN', '*'); // Change to specific domain in production

// Ensure audio directory exists
if (!file_exists(AUDIO_DIR)) {
    mkdir(AUDIO_DIR, 0755, true);
}
