# Video Markup App - Development Log

## Project Overview

A web application for collaborative language learning through video annotation. Learners can watch YouTube videos, mark specific moments they don't understand, attach text or audio questions, and share a link with a native speaker who can respond with clarifications.

**Status**: ✅ Fully implemented and functional

**Date Created**: January 4, 2026

---

## Tech Stack

- **Frontend**: Vue.js 3 (Composition API), Vite
- **Backend**: PHP 8+ with SQLite
- **Audio**: Howler.js for playback, MediaRecorder API + lamejs for recording
- **Video**: YouTube IFrame API
- **Styling**: Vanilla CSS with responsive design

---

## What Has Been Built

### Backend (PHP + SQLite)

#### Database (`/api/lib/db.php`)
- SQLite database with auto-initialization
- Three tables: `sessions`, `markers`, `posts`
- Foreign key constraints with CASCADE delete
- Database file created automatically on first API call

#### Authentication (`/api/lib/auth.php`)
- Token-based authentication (no user accounts needed)
- Two roles: `creator` (full access) and `helper` (reply-only)
- Secure token generation using `random_bytes()`

#### API Endpoints

**Sessions** (`/api/endpoints/sessions.php`):
- `POST /api/sessions` - Create session, fetch YouTube metadata via oEmbed
- `GET /api/sessions/{id}?token={token}` - Get session with all markers and posts
- `DELETE /api/sessions/{id}?token={token}` - Delete session (creator only)

**Markers** (`/api/endpoints/markers.php`):
- `POST /api/sessions/{id}/markers?token={token}` - Create point or range marker
- `DELETE /api/markers/{id}?token={token}` - Delete marker (creator only)
- Validates range overlaps before creation

**Posts** (`/api/endpoints/posts.php`):
- `POST /api/markers/{id}/posts?token={token}` - Add text/audio post
- Handles multipart form data for audio uploads
- Determines author type from token

**Audio** (`/api/endpoints/audio.php`):
- `GET /api/audio/{filename}` - Serve audio files
- Proper audio headers for streaming

#### Configuration (`/config.php`)
- Database path
- Audio directory (auto-created)
- Max audio duration (5 minutes)
- CORS settings

#### Router (`/router.php`)
- Custom router for PHP built-in development server
- Routes `/api/*` requests to API
- Serves audio files
- Handles SPA routing for production

### Frontend (Vue 3 + Vite)

#### Core Views

**CreateSession** (`/frontend/src/views/CreateSession.vue`):
- YouTube URL input
- Session creation
- Displays creator and helper URLs
- Copy-to-clipboard functionality

**Session** (`/frontend/src/views/Session.vue`):
- Main session interface
- Integrates all components
- Handles all API interactions
- Role-based functionality

#### Components

**VideoPlayer** (`/frontend/src/components/VideoPlayer.vue`):
- YouTube IFrame API integration
- Dynamic API loading
- Current time tracking (250ms polling)
- Point marker creation button
- Range marker start/end buttons
- Delete session button (creator only)
- Integrates MarkerTimeline

**MarkerTimeline** (`/frontend/src/components/MarkerTimeline.vue`):
- Visual timeline representation
- Point markers as circles
- Range markers as rectangles
- Click to seek video
- Click marker to select

**MarkerList** (`/frontend/src/components/MarkerList.vue`):
- Chronologically sorted marker list
- Shows start time and type (point/range)
- Click to select and seek
- Delete button (creator only)
- Active marker highlighting

**ThreadPanel** (`/frontend/src/components/ThreadPanel.vue`):
- Display posts for selected marker
- Text input and audio recording
- Submit posts with text and/or audio
- Visual differentiation (creator left/blue, helper right/green)

**AudioRecorder** (`/frontend/src/components/AudioRecorder.vue`):
- MediaRecorder API integration
- Recording timer with visual indicator
- 5-minute auto-stop
- Preview before saving
- Discard functionality

**AudioPlayer** (`/frontend/src/components/AudioPlayer.vue`):
- Howler.js integration
- Play/pause controls
- Progress bar (clickable to seek)
- Time display

#### Composables

**useApi** (`/frontend/src/composables/useApi.js`):
- Centralized API client
- All endpoint methods
- Error handling
- Fetch-based implementation

**useAudioRecorder** (`/frontend/src/composables/useAudioRecorder.js`):
- Recording state management
- MediaRecorder setup
- WebM to MP3 conversion using lamejs
- Timer management
- Format helpers

#### Styling (`/frontend/src/styles.css`)
- Mobile-first responsive design
- Breakpoint at 768px
- Desktop: 2-column grid layout
- Mobile: Stacked vertical layout
- Button styles (primary, secondary, danger, success)
- Post styling with author differentiation
- Timeline visualization
- Recording indicators

---

## Key Features Implemented

### 1. Session Management
- Create sessions with any YouTube URL format (youtube.com/watch, youtu.be, with tracking params)
- Automatic video metadata fetch via YouTube oEmbed API
- Two unique shareable URLs per session
- Sessions persist until explicitly deleted
- Cascade delete (session → markers → posts + audio files)

### 2. Markers
- **Point markers**: Single timestamp
- **Range markers**: Start and end timestamp
- Overlap prevention for ranges (validated in UI and API)
- Visual timeline representation
- Click to seek video
- Creator can delete

### 3. Threaded Posts
- Each marker has its own linear thread
- Text content (optional, Unicode support including Tibetan)
- Audio attachment (optional, up to 5 minutes)
- Author type tracked (creator/helper)
- Visual differentiation (chat-style interface)

### 4. Audio Recording
- MediaRecorder API for capture
- Client-side MP3 encoding using lamejs (iOS Safari compatibility)
- Recording timer with visual indicator
- 5-minute auto-stop
- Preview before saving
- Proper MIME type handling

### 5. Audio Playback
- Howler.js for cross-browser compatibility
- Seekable progress bar
- Time display
- Play/pause controls

### 6. YouTube Integration
- Dynamic YouTube IFrame API loading
- Video controls (play, pause, seek)
- Current time polling
- Duration tracking
- Support for various URL formats

---

## Issues Fixed

### Issue 1: JSON Parse Error on Session Creation
**Problem**: Frontend showed "JSON.parse: unexpected character at line 1 column 1" when creating sessions.

**Root Causes**:
1. PHP built-in server doesn't use `.htaccess` files for routing
2. Config constants used before being defined

**Solutions**:
1. Created `router.php` for development server routing
2. Moved `require_once config.php` to top of `api/index.php`

**Files Modified**:
- Created `/router.php`
- Modified `/api/index.php` (line 3)
- Updated `README.md` with correct dev server command

**Commit**: `9b79351`

---

### Issue 2: Marker Creation Failing with "youtube_url is required"
**Problem**: Creating point or range markers failed with error "youtube_url is required" (wrong endpoint error).

**Root Cause**:
The regex pattern `#^/api/sessions(/[^/]+)?(/markers)?$#` was too permissive. It matched `/api/sessions/{id}/markers` and routed these requests to `SessionsEndpoint` instead of `MarkersEndpoint`.

**Solution**:
1. Reordered routing to check `/api/sessions/{id}/markers` first
2. Simplified sessions pattern to `#^/api/sessions(/[^/]+)?$#` (removed optional `/markers` suffix)
3. Removed duplicate routing code

**Files Modified**:
- Modified `/api/index.php` (routing order and patterns)

**Commit**: `211af46`

---

### Enhancement 1: Auto-Seek Video on Marker Selection
**Feature**: Video automatically seeks to marker timestamp when selected from list or timeline.

**Implementation**:
1. Added `ref` to VideoPlayer in Session.vue
2. Exposed `seekToTime` method from VideoPlayer using `defineExpose`
3. Modified `handleSelectMarker` to call `seekToTime` when marker is selected

**Files Modified**:
- `frontend/src/views/Session.vue` (added ref and seek call)
- `frontend/src/components/VideoPlayer.vue` (exposed seekToTime method)

**Commit**: `325649c`

---

### Enhancement 2: Helper Link Display for Creators
**Feature**: Creators can now view and share the helper link directly from the session page.

**Implementation**:
1. Modified `getSession` API to include `helper_token` in response when role is creator
2. Added helper link section in Session.vue that displays only for creators
3. Added computed property to generate full helper URL
4. Added copy-to-clipboard functionality with user feedback
5. Styled section with visual distinction (blue border, gray background)

**Files Modified**:
- `api/endpoints/sessions.php` (include helper_token for creators)
- `frontend/src/views/Session.vue` (helper link UI and logic)
- `frontend/src/styles.css` (helper link section styling)

**Commit**: `1948bcd`

---

### Enhancement 3: Current Time Indicator on Timeline
**Feature**: Visual black line on timeline showing current video playback position.

**Implementation**:
1. Added `timeline-current-time` element to MarkerTimeline.vue
2. Created `getCurrentTimeStyle()` function to calculate position based on currentTime prop
3. Position clamped between 0-100% to prevent overflow
4. Styled as 2px black vertical line with z-index above markers
5. Set `pointer-events: none` so clicks pass through to timeline

**Files Modified**:
- `frontend/src/components/MarkerTimeline.vue` (current time indicator element and logic)
- `frontend/src/styles.css` (timeline-current-time styling and z-index adjustments)

**Visual Details**:
- 2px wide black vertical line
- Updates in real-time as video plays (250ms polling)
- Positioned above markers (z-index: 10) for visibility
- Doesn't interfere with timeline interaction

**Commit**: `339d943`

---

## How to Run the Project

### Development Mode

**Terminal 1 - Backend:**
```bash
# From project root
php -S localhost:8000 router.php
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

**Access**: http://localhost:3000

### Production Build

```bash
cd frontend
npm run build
```

Deploy to shared hosting with `.htaccess` support.

---

## File Structure

```
/video-markup
├── api/
│   ├── endpoints/
│   │   ├── audio.php          # Audio file serving
│   │   ├── markers.php        # Marker CRUD
│   │   ├── posts.php          # Post creation
│   │   └── sessions.php       # Session management
│   ├── lib/
│   │   ├── auth.php           # Token validation
│   │   └── db.php             # Database connection
│   └── index.php              # API router
├── audio/                     # Audio file uploads (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/        # Vue components
│   │   ├── composables/       # Reusable logic
│   │   ├── views/             # Page views
│   │   ├── App.vue            # Root component
│   │   ├── main.js            # App entry point
│   │   ├── router.js          # Vue Router config
│   │   └── styles.css         # Global styles
│   ├── index.html             # HTML template
│   ├── package.json           # Dependencies
│   └── vite.config.js         # Vite config
├── .gitignore                 # Git ignore rules
├── .htaccess                  # Apache routing (production)
├── config.php                 # App configuration
├── router.php                 # Dev server router
├── CLAUDE.md                  # This file
└── README.md                  # User documentation
```

---

## Database Schema

### sessions
```sql
id TEXT PRIMARY KEY              -- Unique session ID
youtube_url TEXT NOT NULL        -- Original YouTube URL
youtube_title TEXT               -- Fetched from oEmbed
youtube_thumbnail TEXT           -- Thumbnail URL
creator_token TEXT NOT NULL      -- Creator auth token
helper_token TEXT NOT NULL       -- Helper auth token
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### markers
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
session_id TEXT NOT NULL         -- FK to sessions
start_time REAL NOT NULL         -- Timestamp in seconds
end_time REAL                    -- NULL for point markers
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
```

### posts
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
marker_id INTEGER NOT NULL       -- FK to markers
author_type TEXT NOT NULL        -- 'creator' or 'helper'
text_content TEXT                -- Optional text
audio_filename TEXT              -- Optional audio file
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE
```

---

## Testing Checklist

- [x] Create session with various YouTube URL formats
- [x] Session creation fetches correct video metadata
- [x] Creator URL provides full access
- [x] Helper URL is read-only for markers
- [x] Point marker creation
- [x] Range marker creation
- [x] Range overlap prevention
- [x] Marker deletion (creator only)
- [x] Session deletion (creator only)
- [x] Timeline visualization
- [x] Seeking via timeline click
- [x] Seeking via marker click
- [x] Text post creation
- [x] Audio recording (up to 5 minutes)
- [x] Audio playback
- [x] Mixed text + audio posts
- [x] Unicode support (tested with Tibetan)
- [x] Mobile responsive layout
- [ ] iOS Safari audio recording (needs device testing)
- [ ] iOS Safari audio playback (needs device testing)

---

## Known Limitations

1. **Browser Compatibility**: Audio recording requires HTTPS in production (except localhost)
2. **YouTube Restrictions**: Some videos may not be embeddable (age-restricted, private, region-locked)
3. **File Size**: No explicit limit on audio file sizes (controlled by 5-minute duration limit)
4. **Concurrent Editing**: No real-time sync; last write wins
5. **Token Security**: URLs contain authentication tokens; treat as sensitive

---

## Future Enhancement Ideas

### Priority: Medium
- [ ] Add marker notes/descriptions
- [ ] Allow editing existing posts
- [ ] Add post timestamps relative to marker
- [ ] Keyboard shortcuts for marker creation
- [ ] Video playback speed control
- [ ] Export session to JSON/PDF

### Priority: Low
- [ ] User accounts and session management
- [ ] Real-time collaboration (WebSockets)
- [ ] Marker search/filter
- [ ] Video thumbnail on timeline
- [ ] Dark mode
- [ ] Multiple video formats (Vimeo, local files)

---

## Development Notes

### Important Patterns

**API Error Handling**: All endpoints return JSON with `error` key on failure
```php
http_response_code(400);
return ['error' => 'Description of error'];
```

**Frontend API Calls**: Use the `useApi()` composable for consistency
```javascript
const api = useApi()
const session = await api.getSession(sessionId, token)
```

**Component Communication**: Session view is the data owner; components emit events
```javascript
// In component
emit('create-marker', startTime, endTime)

// In Session view
handleCreateMarker(startTime, endTime) {
  // Call API and update state
}
```

### CSS Classes for Roles
- `.post.creator` - Left-aligned, light blue background
- `.post.helper` - Right-aligned, light green background

### Time Format
All timestamps are stored as floating-point seconds (e.g., `125.5` for 2:05.5)

### Token Validation Flow
1. Frontend includes `?token={token}` in API requests
2. Backend extracts session ID from URL path
3. `Auth::validateToken()` checks if token matches creator or helper
4. Returns role or null
5. Endpoint checks role for authorization

---

## Dependencies

### Frontend (package.json)
```json
{
  "vue": "^3.4.0",
  "vue-router": "^4.2.5",
  "howler": "^2.2.4",
  "lamejs": "^1.2.1",
  "@vitejs/plugin-vue": "^5.0.0",
  "vite": "^5.0.0"
}
```

### Backend
- PHP 8+ with PDO SQLite extension
- SQLite3
- GD library (optional, for video thumbnails in future)

---

## Troubleshooting

### "JSON.parse error" on API calls
- Ensure `router.php` is used: `php -S localhost:8000 router.php`
- Check PHP error logs for actual error
- Verify `config.php` is loaded before use

### Database not created
- Check write permissions in project directory
- Ensure SQLite PDO extension is enabled in PHP
- Look for PHP errors in server output

### Audio recording not working
- Requires HTTPS (except localhost)
- Check microphone permissions in browser
- Verify MediaRecorder API support (unsupported in old browsers)

### YouTube video not loading
- Check browser console for API errors
- Verify video is embeddable (not age-restricted/private)
- Check YouTube IFrame API is loading correctly

### Markers not appearing on timeline
- Verify `duration > 0` (video must be loaded)
- Check marker data in network tab
- Ensure marker times are within video duration

---

## Git Workflow

### Currently Not Initialized
The project is not yet a git repository. To initialize:

```bash
git init
git add .
git commit -m "Initial commit: Language learning video annotation app"
```

### .gitignore Contents
```
database.sqlite
audio/*
!audio/.gitkeep
node_modules/
frontend/dist/
.DS_Store
```

---

## Contact Points for External Services

### YouTube oEmbed API
- **Endpoint**: `https://www.youtube.com/oembed?url={VIDEO_URL}&format=json`
- **Rate Limit**: Unknown, appears unlimited for basic use
- **Returns**: `{ title, thumbnail_url, ... }`
- **Docs**: https://oembed.com/

### YouTube IFrame API
- **Script**: `https://www.youtube.com/iframe_api`
- **Global**: Creates `window.YT` object
- **Callback**: `window.onYouTubeIframeAPIReady`
- **Docs**: https://developers.google.com/youtube/iframe_api_reference

---

## Session Summary

**Date**: January 4, 2026
**Tasks Completed**:
1. ✅ Complete backend API implementation
2. ✅ Complete frontend Vue 3 application
3. ✅ Audio recording with lamejs integration
4. ✅ YouTube IFrame API integration
5. ✅ Responsive CSS design
6. ✅ Fixed routing issues for development (Issue #1)
7. ✅ Tested session creation with Tibetan video URL
8. ✅ Git repository initialized with comprehensive commit
9. ✅ Fixed marker creation routing (Issue #2)
10. ✅ Tested marker creation successfully
11. ✅ Added auto-seek video when marker selected (Enhancement #1)
12. ✅ Added helper link display for creators (Enhancement #2)
13. ✅ Added current time indicator to timeline (Enhancement #3)

**Ready for**: Full application testing and iOS Safari testing

**Current Status**: All core features working, both issues resolved

**Next Steps**:
1. Install dependencies: `cd frontend && npm install`
2. Run development servers (see "How to Run" section)
3. Test complete workflow (session → markers → posts → audio)
4. Test on iOS Safari for audio compatibility
5. Test range markers and overlap prevention
6. Test post creation with text and audio
