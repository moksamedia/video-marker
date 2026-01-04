<?php

class AudioEndpoint {
    public function handleRequest($method, $path) {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        // Extract filename from path: /api/audio/{filename}
        preg_match('/\/api\/audio\/([^\/]+)/', $path, $matches);
        $filename = $matches[1] ?? null;

        if (!$filename) {
            http_response_code(400);
            echo json_encode(['error' => 'Filename is required']);
            return;
        }

        // Sanitize filename to prevent directory traversal
        $filename = basename($filename);
        $filepath = AUDIO_DIR . '/' . $filename;

        if (!file_exists($filepath)) {
            http_response_code(404);
            echo json_encode(['error' => 'Audio file not found']);
            return;
        }

        // Serve the audio file
        header('Content-Type: audio/mpeg');
        header('Content-Length: ' . filesize($filepath));
        header('Accept-Ranges: bytes');
        header('Cache-Control: public, max-age=31536000');

        readfile($filepath);
    }
}
