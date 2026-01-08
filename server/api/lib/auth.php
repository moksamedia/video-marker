<?php

class Auth {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function validateToken($sessionId, $token) {
        $stmt = $this->pdo->prepare(
            'SELECT creator_token, helper_token FROM sessions WHERE id = ?'
        );
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            return null;
        }

        if ($token === $session['creator_token']) {
            return 'creator';
        } elseif ($token === $session['helper_token']) {
            return 'helper';
        }

        return null;
    }

    public function generateToken() {
        return bin2hex(random_bytes(16));
    }

    public function generateSessionId() {
        return bin2hex(random_bytes(8));
    }
}
