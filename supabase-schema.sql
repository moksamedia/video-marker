-- Video Markup App - Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_url TEXT NOT NULL,
    youtube_title TEXT,
    youtube_thumbnail TEXT,
    creator_token UUID NOT NULL DEFAULT gen_random_uuid(),
    helper_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markers table
CREATE TABLE markers (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    start_time REAL NOT NULL,
    end_time REAL,  -- NULL for point markers
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    marker_id INTEGER NOT NULL REFERENCES markers(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('creator', 'helper')),
    text_content TEXT,
    audio_path TEXT,  -- Path in Supabase Storage, NULL if no audio
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_markers_session_id ON markers(session_id);
CREATE INDEX idx_posts_marker_id ON posts(marker_id);
CREATE INDEX idx_sessions_creator_token ON sessions(creator_token);
CREATE INDEX idx_sessions_helper_token ON sessions(helper_token);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Sessions Policies
-- Anyone can create sessions
CREATE POLICY "Anyone can create sessions" ON sessions
    FOR INSERT
    WITH CHECK (true);

-- Sessions viewable with valid token (creator or helper)
CREATE POLICY "Sessions viewable with valid token" ON sessions
    FOR SELECT
    USING (
        creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
        OR helper_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
    );

-- Only creator can delete session
CREATE POLICY "Creator can delete session" ON sessions
    FOR DELETE
    USING (
        creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
    );

-- Markers Policies
-- Markers viewable if user has access to parent session
CREATE POLICY "Markers viewable with valid session token" ON markers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = markers.session_id
            AND (
                s.creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
                OR s.helper_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
            )
        )
    );

-- Only creator can insert markers
CREATE POLICY "Creator can insert markers" ON markers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = markers.session_id
            AND s.creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
        )
    );

-- Only creator can delete markers
CREATE POLICY "Creator can delete markers" ON markers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = markers.session_id
            AND s.creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
        )
    );

-- Posts Policies
-- Posts viewable if user has access to parent session
CREATE POLICY "Posts viewable with valid session token" ON posts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM markers m
            JOIN sessions s ON s.id = m.session_id
            WHERE m.id = posts.marker_id
            AND (
                s.creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
                OR s.helper_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
            )
        )
    );

-- Anyone with session access can insert posts
CREATE POLICY "Session participants can insert posts" ON posts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM markers m
            JOIN sessions s ON s.id = m.session_id
            WHERE m.id = posts.marker_id
            AND (
                s.creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
                OR s.helper_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
            )
        )
    );

-- ============================================
-- DATABASE FUNCTION: Get Session with Role
-- ============================================

CREATE OR REPLACE FUNCTION get_session_with_role(
    p_session_id UUID,
    p_token UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_role TEXT;
BEGIN
    -- Determine role based on token
    SELECT
        CASE
            WHEN creator_token = p_token THEN 'creator'
            WHEN helper_token = p_token THEN 'helper'
            ELSE NULL
        END INTO v_role
    FROM sessions
    WHERE id = p_session_id;

    -- If token is invalid, return null
    IF v_role IS NULL THEN
        RETURN NULL;
    END IF;

    -- Build complete response with session, markers, and posts
    SELECT json_build_object(
        'id', s.id,
        'youtube_url', s.youtube_url,
        'youtube_title', s.youtube_title,
        'youtube_thumbnail', s.youtube_thumbnail,
        'created_at', s.created_at,
        'role', v_role,
        'helper_token', CASE WHEN v_role = 'creator' THEN s.helper_token ELSE NULL END,
        'markers', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', m.id,
                    'session_id', m.session_id,
                    'start_time', m.start_time,
                    'end_time', m.end_time,
                    'created_at', m.created_at,
                    'posts', COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', p.id,
                                'marker_id', p.marker_id,
                                'author_type', p.author_type,
                                'text_content', p.text_content,
                                'audio_filename', p.audio_path,
                                'created_at', p.created_at
                            ) ORDER BY p.created_at ASC
                        ) FROM posts p WHERE p.marker_id = m.id),
                        '[]'::json
                    )
                ) ORDER BY m.start_time ASC
            ) FROM markers m WHERE m.session_id = s.id),
            '[]'::json
        )
    ) INTO v_result
    FROM sessions s
    WHERE s.id = p_session_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE POLICIES (run after creating bucket)
-- ============================================

-- Create audio bucket (run this or use dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('audio', 'audio', true);

-- Storage policy: public read access
-- CREATE POLICY "Public audio access" ON storage.objects
--     FOR SELECT USING (bucket_id = 'audio');

-- Storage policy: allow uploads
-- CREATE POLICY "Allow audio uploads" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'audio');

-- Storage policy: allow deletes
-- CREATE POLICY "Allow audio deletes" ON storage.objects
--     FOR DELETE USING (bucket_id = 'audio');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test: Create a session
-- INSERT INTO sessions (youtube_url, youtube_title)
-- VALUES ('https://youtube.com/watch?v=test', 'Test Video')
-- RETURNING *;

-- Test: View all sessions
-- SELECT id, youtube_title, creator_token, helper_token FROM sessions;

-- Test: Call get_session_with_role function
-- SELECT get_session_with_role(
--     'your-session-id-here'::uuid,
--     'your-token-here'::uuid
-- );
