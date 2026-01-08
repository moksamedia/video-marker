<?php

require_once __DIR__ . '/../../config.php';

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $dbExists = file_exists(DB_PATH);

        $this->pdo = new PDO('sqlite:' . DB_PATH);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Enable foreign keys
        $this->pdo->exec('PRAGMA foreign_keys = ON');

        if (!$dbExists) {
            $this->createSchema();
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    private function createSchema() {
        $schema = <<<SQL
        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            youtube_url TEXT NOT NULL,
            youtube_title TEXT,
            youtube_thumbnail TEXT,
            creator_token TEXT NOT NULL,
            helper_token TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE markers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            start_time REAL NOT NULL,
            end_time REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marker_id INTEGER NOT NULL,
            author_type TEXT NOT NULL CHECK (author_type IN ('creator', 'helper')),
            text_content TEXT,
            audio_filename TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE
        );
        SQL;

        $this->pdo->exec($schema);
    }
}
