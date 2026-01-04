<?php

require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once __DIR__ . '/endpoints/sessions.php';
require_once __DIR__ . '/endpoints/markers.php';
require_once __DIR__ . '/endpoints/posts.php';
require_once __DIR__ . '/endpoints/audio.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$params = $_GET;

try {
    // Route requests
    if (preg_match('#^/api/sessions(/[^/]+)?(/markers)?$#', $path)) {
        $endpoint = new SessionsEndpoint();
        $result = $endpoint->handleRequest($method, $path, $params);
        echo json_encode($result);
    } elseif (preg_match('#^/api/sessions/[^/]+/markers$#', $path)) {
        $endpoint = new MarkersEndpoint();
        $result = $endpoint->handleRequest($method, $path, $params);
        echo json_encode($result);
    } elseif (preg_match('#^/api/markers/[^/]+(/posts)?$#', $path)) {
        if (strpos($path, '/posts') !== false) {
            $endpoint = new PostsEndpoint();
            $result = $endpoint->handleRequest($method, $path, $params);
            echo json_encode($result);
        } else {
            $endpoint = new MarkersEndpoint();
            $result = $endpoint->handleRequest($method, $path, $params);
            echo json_encode($result);
        }
    } elseif (preg_match('#^/api/audio/[^/]+$#', $path)) {
        $endpoint = new AudioEndpoint();
        $endpoint->handleRequest($method, $path);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
