<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

class PostsEndpoint {
    private $pdo;
    private $auth;

    public function __construct() {
        $db = Database::getInstance();
        $this->pdo = $db->getConnection();
        $this->auth = new Auth($this->pdo);
    }

    public function handleRequest($method, $path, $params) {
        if ($method === 'POST') {
            return $this->createPost($path, $params);
        }

        http_response_code(405);
        return ['error' => 'Method not allowed'];
    }

    private function createPost($path, $params) {
        // Extract marker ID from path: /api/markers/{id}/posts
        preg_match('/\/api\/markers\/([^\/]+)\/posts/', $path, $matches);
        $markerId = $matches[1] ?? null;

        if (!$markerId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Marker ID and token are required'];
        }

        // Get session ID for this marker
        $stmt = $this->pdo->prepare('SELECT session_id FROM markers WHERE id = ?');
        $stmt->execute([$markerId]);
        $marker = $stmt->fetch();

        if (!$marker) {
            http_response_code(404);
            return ['error' => 'Marker not found'];
        }

        $role = $this->auth->validateToken($marker['session_id'], $params['token']);
        if (!$role) {
            http_response_code(403);
            return ['error' => 'Invalid token'];
        }

        $textContent = $_POST['text_content'] ?? null;
        $audioFilename = null;

        // Handle audio upload
        if (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
            $audioFilename = uniqid() . '.mp3';
            $uploadPath = AUDIO_DIR . '/' . $audioFilename;

            if (!move_uploaded_file($_FILES['audio']['tmp_name'], $uploadPath)) {
                http_response_code(500);
                return ['error' => 'Failed to save audio file'];
            }
        }

        // At least one of text or audio must be present
        if (!$textContent && !$audioFilename) {
            http_response_code(400);
            return ['error' => 'Either text_content or audio is required'];
        }

        // Insert post
        $stmt = $this->pdo->prepare(
            'INSERT INTO posts (marker_id, author_type, text_content, audio_filename) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$markerId, $role, $textContent, $audioFilename]);

        $postId = $this->pdo->lastInsertId();

        // Return the created post
        $stmt = $this->pdo->prepare('SELECT * FROM posts WHERE id = ?');
        $stmt->execute([$postId]);
        $post = $stmt->fetch();

        http_response_code(201);
        return $post;
    }
}
