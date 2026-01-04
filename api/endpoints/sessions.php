<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

class SessionsEndpoint {
    private $pdo;
    private $auth;

    public function __construct() {
        $db = Database::getInstance();
        $this->pdo = $db->getConnection();
        $this->auth = new Auth($this->pdo);
    }

    public function handleRequest($method, $path, $params) {
        switch ($method) {
            case 'POST':
                return $this->createSession();
            case 'GET':
                return $this->getSession($path, $params);
            case 'DELETE':
                return $this->deleteSession($path, $params);
            default:
                http_response_code(405);
                return ['error' => 'Method not allowed'];
        }
    }

    private function createSession() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['youtube_url'])) {
            http_response_code(400);
            return ['error' => 'youtube_url is required'];
        }

        // Fetch YouTube video metadata
        $oembedUrl = 'https://www.youtube.com/oembed?url=' . urlencode($data['youtube_url']) . '&format=json';
        $metadata = @file_get_contents($oembedUrl);

        if ($metadata === false) {
            http_response_code(400);
            return ['error' => 'Invalid YouTube URL'];
        }

        $metadata = json_decode($metadata, true);

        // Generate tokens and ID
        $sessionId = $this->auth->generateSessionId();
        $creatorToken = $this->auth->generateToken();
        $helperToken = $this->auth->generateToken();

        // Insert session
        $stmt = $this->pdo->prepare(
            'INSERT INTO sessions (id, youtube_url, youtube_title, youtube_thumbnail, creator_token, helper_token)
             VALUES (?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $sessionId,
            $data['youtube_url'],
            $metadata['title'] ?? null,
            $metadata['thumbnail_url'] ?? null,
            $creatorToken,
            $helperToken
        ]);

        http_response_code(201);
        return [
            'id' => $sessionId,
            'creator_token' => $creatorToken,
            'helper_token' => $helperToken,
            'youtube_title' => $metadata['title'] ?? null,
            'youtube_thumbnail' => $metadata['thumbnail_url'] ?? null
        ];
    }

    private function getSession($path, $params) {
        // Extract session ID from path: /api/sessions/{id}
        preg_match('/\/api\/sessions\/([^\/]+)/', $path, $matches);
        $sessionId = $matches[1] ?? null;

        if (!$sessionId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Session ID and token are required'];
        }

        $role = $this->auth->validateToken($sessionId, $params['token']);
        if (!$role) {
            http_response_code(403);
            return ['error' => 'Invalid token'];
        }

        // Get session data
        $stmt = $this->pdo->prepare('SELECT id, youtube_url, youtube_title, youtube_thumbnail, helper_token, created_at FROM sessions WHERE id = ?');
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            http_response_code(404);
            return ['error' => 'Session not found'];
        }

        // Get all markers with posts
        $stmt = $this->pdo->prepare('SELECT * FROM markers WHERE session_id = ? ORDER BY start_time ASC');
        $stmt->execute([$sessionId]);
        $markers = $stmt->fetchAll();

        // Get posts for each marker
        foreach ($markers as &$marker) {
            $stmt = $this->pdo->prepare('SELECT * FROM posts WHERE marker_id = ? ORDER BY created_at ASC');
            $stmt->execute([$marker['id']]);
            $marker['posts'] = $stmt->fetchAll();
        }

        $session['markers'] = $markers;
        $session['role'] = $role;

        // Only include helper_token if requester is creator
        if ($role !== 'creator') {
            unset($session['helper_token']);
        }

        return $session;
    }

    private function deleteSession($path, $params) {
        preg_match('/\/api\/sessions\/([^\/]+)/', $path, $matches);
        $sessionId = $matches[1] ?? null;

        if (!$sessionId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Session ID and token are required'];
        }

        $role = $this->auth->validateToken($sessionId, $params['token']);
        if ($role !== 'creator') {
            http_response_code(403);
            return ['error' => 'Only creator can delete session'];
        }

        // Get all audio files to delete
        $stmt = $this->pdo->prepare(
            'SELECT audio_filename FROM posts WHERE marker_id IN (SELECT id FROM markers WHERE session_id = ?)'
        );
        $stmt->execute([$sessionId]);
        $audioFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Delete session (cascades to markers and posts)
        $stmt = $this->pdo->prepare('DELETE FROM sessions WHERE id = ?');
        $stmt->execute([$sessionId]);

        // Delete audio files
        foreach ($audioFiles as $filename) {
            if ($filename) {
                $filepath = AUDIO_DIR . '/' . $filename;
                if (file_exists($filepath)) {
                    unlink($filepath);
                }
            }
        }

        return ['success' => true];
    }
}
