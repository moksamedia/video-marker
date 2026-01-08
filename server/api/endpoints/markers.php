<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

class MarkersEndpoint {
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
                return $this->createMarker($path, $params);
            case 'PUT':
            case 'PATCH':
                return $this->updateMarker($path, $params);
            case 'DELETE':
                return $this->deleteMarker($path, $params);
            default:
                http_response_code(405);
                return ['error' => 'Method not allowed'];
        }
    }

    private function createMarker($path, $params) {
        // Extract session ID from path: /api/sessions/{id}/markers
        preg_match('/\/api\/sessions\/([^\/]+)\/markers/', $path, $matches);
        $sessionId = $matches[1] ?? null;

        if (!$sessionId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Session ID and token are required'];
        }

        $role = $this->auth->validateToken($sessionId, $params['token']);
        if ($role !== 'creator') {
            http_response_code(403);
            return ['error' => 'Only creator can create markers'];
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['start_time'])) {
            http_response_code(400);
            return ['error' => 'start_time is required'];
        }

        $startTime = (float)$data['start_time'];
        $endTime = isset($data['end_time']) ? (float)$data['end_time'] : null;

        // Check for overlapping ranges if this is a range marker
        if ($endTime !== null) {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) as count FROM markers
                 WHERE session_id = ?
                 AND end_time IS NOT NULL
                 AND NOT (end_time <= ? OR start_time >= ?)'
            );
            $stmt->execute([$sessionId, $startTime, $endTime]);
            $result = $stmt->fetch();

            if ($result['count'] > 0) {
                http_response_code(400);
                return ['error' => 'Marker range overlaps with existing range'];
            }
        }

        // Insert marker
        $stmt = $this->pdo->prepare(
            'INSERT INTO markers (session_id, start_time, end_time) VALUES (?, ?, ?)'
        );
        $stmt->execute([$sessionId, $startTime, $endTime]);

        $markerId = $this->pdo->lastInsertId();

        // Return the created marker
        $stmt = $this->pdo->prepare('SELECT * FROM markers WHERE id = ?');
        $stmt->execute([$markerId]);
        $marker = $stmt->fetch();

        http_response_code(201);
        return $marker;
    }

    private function updateMarker($path, $params) {
        // Extract marker ID from path: /api/markers/{id}
        preg_match('/\/api\/markers\/([^\/]+)/', $path, $matches);
        $markerId = $matches[1] ?? null;

        if (!$markerId || !isset($params['token'])) {
            http_response_code(400);
            return ['error' => 'Marker ID and token are required'];
        }

        // Get session ID for this marker
        $stmt = $this->pdo->prepare('SELECT session_id, start_time, end_time FROM markers WHERE id = ?');
        $stmt->execute([$markerId]);
        $marker = $stmt->fetch();

        if (!$marker) {
            http_response_code(404);
            return ['error' => 'Marker not found'];
        }

        $role = $this->auth->validateToken($marker['session_id'], $params['token']);
        if ($role !== 'creator') {
            http_response_code(403);
            return ['error' => 'Only creator can update markers'];
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Get new times, defaulting to current values
        $newStartTime = isset($data['start_time']) ? (float)$data['start_time'] : $marker['start_time'];
        $newEndTime = isset($data['end_time']) ? (float)$data['end_time'] : $marker['end_time'];

        // Validate that start_time is not negative
        if ($newStartTime < 0) {
            http_response_code(400);
            return ['error' => 'Start time cannot be negative'];
        }

        // Validate range marker end time
        if ($newEndTime !== null && $newEndTime <= $newStartTime) {
            http_response_code(400);
            return ['error' => 'End time must be after start time'];
        }

        // Update marker
        $stmt = $this->pdo->prepare(
            'UPDATE markers SET start_time = ?, end_time = ? WHERE id = ?'
        );
        $stmt->execute([$newStartTime, $newEndTime, $markerId]);

        // Return updated marker
        $stmt = $this->pdo->prepare('SELECT * FROM markers WHERE id = ?');
        $stmt->execute([$markerId]);
        $updatedMarker = $stmt->fetch();

        return $updatedMarker;
    }

    private function deleteMarker($path, $params) {
        // Extract marker ID from path: /api/markers/{id}
        preg_match('/\/api\/markers\/([^\/]+)/', $path, $matches);
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
        if ($role !== 'creator') {
            http_response_code(403);
            return ['error' => 'Only creator can delete markers'];
        }

        // Get audio files to delete
        $stmt = $this->pdo->prepare('SELECT audio_filename FROM posts WHERE marker_id = ?');
        $stmt->execute([$markerId]);
        $audioFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Delete marker (cascades to posts)
        $stmt = $this->pdo->prepare('DELETE FROM markers WHERE id = ?');
        $stmt->execute([$markerId]);

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
