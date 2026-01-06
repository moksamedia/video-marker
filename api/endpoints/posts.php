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

        if ($method === 'PUT') {
            return $this->updatePost($path, $params);
        }

        if ($method === 'DELETE') {
            return $this->deletePost($path, $params);
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

    private function deletePost($path, $params) {
        // Extract post ID from path: /api/posts/{id}
        preg_match('/\/api\/posts\/([^\/]+)/', $path, $matches);
        $postId = $matches[1] ?? null;

        if (!$postId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Post ID and token are required'];
        }

        // Get post details
        $stmt = $this->pdo->prepare('
            SELECT p.*, m.session_id
            FROM posts p
            JOIN markers m ON p.marker_id = m.id
            WHERE p.id = ?
        ');
        $stmt->execute([$postId]);
        $post = $stmt->fetch();

        if (!$post) {
            http_response_code(404);
            return ['error' => 'Post not found'];
        }

        // Validate token
        $role = $this->auth->validateToken($post['session_id'], $params['token']);
        if (!$role) {
            http_response_code(403);
            return ['error' => 'Invalid token'];
        }

        // Check if user owns this post
        if ($post['author_type'] !== $role) {
            http_response_code(403);
            return ['error' => 'You can only delete your own posts'];
        }

        // Delete audio file if exists
        if ($post['audio_filename']) {
            $filepath = AUDIO_DIR . '/' . $post['audio_filename'];
            if (file_exists($filepath)) {
                unlink($filepath);
            }
        }

        // Delete post
        $stmt = $this->pdo->prepare('DELETE FROM posts WHERE id = ?');
        $stmt->execute([$postId]);

        return ['success' => true];
    }

    private function updatePost($path, $params) {
        // Extract post ID from path: /api/posts/{id}
        preg_match('/\/api\/posts\/([^\/]+)/', $path, $matches);
        $postId = $matches[1] ?? null;

        if (!$postId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Post ID and token are required'];
        }

        // Get post details
        $stmt = $this->pdo->prepare('
            SELECT p.*, m.session_id
            FROM posts p
            JOIN markers m ON p.marker_id = m.id
            WHERE p.id = ?
        ');
        $stmt->execute([$postId]);
        $post = $stmt->fetch();

        if (!$post) {
            http_response_code(404);
            return ['error' => 'Post not found'];
        }

        // Validate token
        $role = $this->auth->validateToken($post['session_id'], $params['token']);
        if (!$role) {
            http_response_code(403);
            return ['error' => 'Invalid token'];
        }

        // Check if user owns this post
        if ($post['author_type'] !== $role) {
            http_response_code(403);
            return ['error' => 'You can only edit your own posts'];
        }

        // Get updated text content
        $data = json_decode(file_get_contents('php://input'), true);
        $textContent = $data['text_content'] ?? null;

        if ($textContent === null) {
            http_response_code(400);
            return ['error' => 'text_content is required'];
        }

        // Update post
        $stmt = $this->pdo->prepare('UPDATE posts SET text_content = ? WHERE id = ?');
        $stmt->execute([$textContent, $postId]);

        // Return updated post
        $stmt = $this->pdo->prepare('SELECT * FROM posts WHERE id = ?');
        $stmt->execute([$postId]);
        $updatedPost = $stmt->fetch();

        return $updatedPost;
    }
}
