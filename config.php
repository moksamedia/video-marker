<?php

define('DB_PATH', __DIR__ . '/database.sqlite');
define('AUDIO_DIR', __DIR__ . '/audio');
define('MAX_AUDIO_DURATION', 300); // 5 minutes in seconds
define('CORS_ORIGIN', '*'); // Change to specific domain in production

// Ensure audio directory exists
if (!file_exists(AUDIO_DIR)) {
    mkdir(AUDIO_DIR, 0755, true);
}
