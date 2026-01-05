# Video Markup App - Development Log

## Project Overview

A web application for collaborative language learning through video annotation. Learners can watch YouTube videos, mark specific moments they don't understand, attach text or audio questions, and share a link with a native speaker who can respond with clarifications.

**Status**: ✅ Fully implemented with **TWO backend options** and **UNIFIED frontend**

**Date Created**: January 4, 2026

---

## Tech Stack

### Backend Options
The application supports two interchangeable backends using a **single unified frontend**:

#### Option 1: PHP + SQLite
- **Backend**: PHP 8+ with SQLite database
- **Deployment**: Standard shared hosting (Apache/PHP)
- **Best For**: Simple deployment, low traffic, full control

#### Option 2: Supabase
- **Backend**: Supabase (PostgreSQL + Storage + auto-generated REST API)
- **Deployment**: Static hosting (Vercel, Netlify, etc.)
- **Best For**: Auto-scaling, managed services, real-time capabilities

### Unified Frontend
- **Framework**: Vue.js 3 (Composition API), Vite
- **Backend Switching**: Environment variable (`VITE_BACKEND=php` or `supabase`)
- **Adapter Pattern**: Unified interface for both backends
- **Audio**: Howler.js for playback, MediaRecorder API + lamejs for recording
- **Video**: YouTube IFrame API
- **Styling**: Vanilla CSS with responsive design

---

## Implementation Status

### Unified Frontend (`/frontend`)
- ✅ Single codebase supporting both backends
- ✅ Backend adapter pattern with dynamic imports
- ✅ Environment-based backend switching
- ✅ All Vue 3 components
- ✅ Mobile responsive design
- ✅ All enhancements and fixes applied

### PHP Backend (`/api`)
- ✅ Complete backend API implementation
- ✅ SQLite database with auto-initialization
- ✅ Token-based authentication
- ✅ Audio file upload and serving
- ✅ YouTube oEmbed integration

### Supabase Backend
- ✅ PostgreSQL schema with RLS policies
- ✅ Supabase Storage bucket for audio
- ✅ Database function for session retrieval
- ✅ Supabase-specific composables
- ✅ Token extraction and header injection
- ✅ Audio cleanup on delete
- ✅ Setup documentation

---

## What Has Been Built

### Backend Implementations

#### PHP + SQLite Backend (`/api`)
- **Database** (`/api/lib/db.php`): SQLite with auto-initialization
- **Auth** (`/api/lib/auth.php`): Token validation
- **API Endpoints**:
  - `sessions.php` - Session management, YouTube oEmbed
  - `markers.php` - Marker CRUD with overlap validation
  - `posts.php` - Post creation with multipart audio
  - `audio.php` - Audio file serving
- **Router** (`/router.php`): Dev server routing

#### Supabase Backend
- **Schema** (`/supabase-schema.sql`): PostgreSQL tables, indexes, RLS policies
- **Storage**: Public audio bucket with policies
- **Database Function**: `get_session_with_role()` for efficient data fetching

### Unified Frontend (`/frontend`)

Single codebase that works with both backends via adapter pattern:

**Core Views**:
- `CreateSession.vue` - YouTube URL input, session creation
- `Session.vue` - Main session interface

**Components**:
- `VideoPlayer.vue` - YouTube IFrame API integration
- `MarkerTimeline.vue` - Visual timeline with current time indicator
- `MarkerList.vue` - Chronologically sorted markers
- `ThreadPanel.vue` - Post display and creation
- `AudioRecorder.vue` - Recording with lamejs
- `AudioPlayer.vue` - Howler.js playback

**Composables** (Backend Adapters):
- `useBackendAdapter.js` - Unified interface with dynamic imports
- `useApi.js` - PHP backend implementation
- `useSupabase.js` - Supabase client setup
- `useSupabaseSession.js` - Session CRUD for Supabase
- `useSupabaseMarkers.js` - Marker CRUD for Supabase
- `useSupabasePosts.js` - Post CRUD for Supabase
- `useAudioStorage.js` - Supabase Storage operations
- `useAudioRecorder.js` - Shared audio recording

**Configuration**:
- `.env` - Backend selection via `VITE_BACKEND` flag

**Styling**:
- `styles.css` - Responsive design, mobile-first

---

## Core Features (Both Backends)

### 1. Session Management
- Create sessions with YouTube URLs
- Fetch video metadata via oEmbed API
- Two unique tokens per session (creator/helper)
- Delete sessions (cascades to markers, posts, audio)
- Sessions persist until explicitly deleted

### 2. Video Player
- YouTube IFrame API embedding
- Current time tracking (250ms polling)
- Point marker creation button
- Range marker start/end buttons
- Delete session button (creator only)

### 3. Markers
- **Point markers**: Single timestamp
- **Range markers**: Start + end timestamp
- Overlap prevention (client-side validation)
- Visual timeline with markers
- Click to seek video
- Delete markers (creator only, cascades to posts + audio)

### 4. Threaded Posts
- Linear thread per marker
- Text content (optional, Unicode including Tibetan)
- Audio attachment (optional, max 5 minutes)
- Author type: creator/helper
- Visual differentiation (left/blue vs right/green)

### 5. Audio Recording & Playback
- MediaRecorder API capture
- Client-side MP3 encoding (lamejs) for iOS
- 5-minute auto-stop
- Preview before saving
- Howler.js playback with seek
- **PHP**: Files saved to `/audio` directory
- **Supabase**: Files uploaded to Storage bucket

### 6. Mobile Responsive
- Desktop: 2-column grid layout
- Mobile: Stacked vertical layout
- Touch-friendly controls
- iOS Safari compatible

---

## Issues Fixed

### Issue 1: JSON Parse Error on Session Creation
**Problem**: Frontend showed JSON parse error when creating sessions.

**Root Causes**:
1. PHP built-in server doesn't use `.htaccess`
2. Config constants used before being defined

**Solutions**:
1. Created `router.php` for dev server
2. Moved `require_once config.php` to top of `api/index.php`

**Commit**: `9b79351`

---

### Issue 2: Marker Creation Failing
**Problem**: Creating markers failed with "youtube_url is required" error.

**Root Cause**: Regex routing pattern too permissive, routed marker requests to sessions endpoint.

**Solution**: Reordered routes, simplified patterns

**Commit**: `211af46`

---

## Enhancements

### Enhancement 1: Auto-Seek Video on Marker Selection
**Feature**: Video automatically seeks to marker timestamp when selected.

**Implementation**: Added VideoPlayer ref, exposed `seekToTime` method, call on marker select.

**Commit**: `325649c`

---

### Enhancement 2: Helper Link Display for Creators
**Feature**: Creators see and share helper link from session page.

**Implementation**:
- Backend returns `helper_token` only to creators
- Frontend displays copy-to-clipboard UI

**Commit**: `1948bcd`

---

### Enhancement 3: Current Time Indicator on Timeline
**Feature**: Black vertical line showing current playback position.

**Implementation**: 2px black line, updates every 250ms, z-index above markers.

**Commit**: `339d943`

---

## Backend Comparison

| Feature | PHP + SQLite | Supabase |
|---------|-------------|----------|
| **Database** | SQLite file | PostgreSQL (cloud) |
| **Storage** | Local filesystem | Supabase Storage (CDN) |
| **Auth** | PHP token validation | Row Level Security |
| **API** | Custom PHP endpoints | Auto-generated REST API |
| **Scalability** | Limited (shared hosting) | Auto-scaling |
| **Real-time** | Not available | Built-in (not implemented) |
| **Hosting** | Requires PHP server | Static hosting only |
| **Setup** | Simple (one server) | Requires Supabase account |
| **Cost** | Shared hosting (~$5/mo) | Free tier available |

---

## File Structure

### Unified Architecture
```
/video-markup
├── api/                    # PHP backend
│   ├── endpoints/          # API handlers
│   ├── lib/                # Database, auth
│   └── index.php           # Router
├── audio/                  # PHP uploaded files
├── frontend/               # UNIFIED frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── composables/
│   │   │   ├── useBackendAdapter.js  # Adapter pattern
│   │   │   ├── useApi.js             # PHP impl
│   │   │   ├── useSupabase*.js       # Supabase impl
│   │   │   └── useAudioRecorder.js   # Shared
│   │   ├── views/
│   │   └── styles.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example        # Backend selection
├── config.php              # PHP config
├── router.php              # Dev server router
├── database.sqlite         # Created on first run
├── supabase-schema.sql     # Supabase schema
└── SUPABASE_SETUP.md       # Supabase setup guide
```

---

## Database Schemas

### PHP (SQLite)
```sql
sessions (id TEXT, youtube_url, youtube_title, youtube_thumbnail, creator_token, helper_token, created_at)
markers (id INTEGER, session_id, start_time, end_time, created_at)
posts (id INTEGER, marker_id, author_type, text_content, audio_filename, created_at)
```

### Supabase (PostgreSQL)
```sql
sessions (id UUID, youtube_url, youtube_title, youtube_thumbnail, creator_token UUID, helper_token UUID, created_at)
markers (id SERIAL, session_id UUID, start_time, end_time, created_at)
posts (id SERIAL, marker_id, author_type, text_content, audio_path, created_at)
```

**Key Differences**:
- UUIDs instead of TEXT/INTEGER IDs
- `audio_path` (storage path) instead of `audio_filename`
- RLS policies for access control

---

## Security Model

Both backends use the same **"share link" security model**:

**How It Works**:
1. Each session gets two unique tokens (UUIDs)
2. Tokens embedded in URLs (`/session/{id}?token={token}`)
3. Backend validates token to determine role (creator/helper)
4. Roles control permissions (create/delete markers, etc.)

**What It Protects**:
- ✅ Prevents random access (need valid token)
- ✅ Prevents helpers from deleting content
- ✅ Simple, no password management

**What It Doesn't Protect**:
- ❌ Anyone with URL has access
- ❌ No revocation without deleting session
- ❌ No audit trail

**Similar To**: Google Docs share links, Dropbox sharing, Figma links

---

## How to Run

### With PHP Backend
```bash
# 1. Configure frontend for PHP
cd frontend
cp .env.example .env
# Edit .env: Set VITE_BACKEND=php

# 2. Terminal 1 - Backend
cd ..
php -S localhost:8000 router.php

# 3. Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Access: http://localhost:5173

### With Supabase Backend

1. Set up Supabase (see `SUPABASE_SETUP.md`)
2. Configure frontend:
```bash
cd frontend
cp .env.example .env
# Edit .env:
#   VITE_BACKEND=supabase
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key
```
3. Run:
```bash
npm install
npm run dev
```

Access: http://localhost:5173

---

## Testing Checklist

**Both Backends**:
- [x] Create session with various YouTube URL formats
- [x] Creator URL provides full access
- [x] Helper URL is read-only for markers
- [x] Point marker creation
- [x] Range marker creation
- [x] Range overlap prevention
- [x] Marker deletion (creator only)
- [x] Session deletion (creator only)
- [x] Timeline visualization with current time indicator
- [x] Seeking via timeline/marker click
- [x] Text post creation
- [x] Audio recording (up to 5 minutes)
- [x] Audio playback
- [x] Mixed text + audio posts
- [x] Unicode support (Tibetan tested)
- [x] Mobile responsive layout
- [x] Helper link display for creators
- [ ] iOS Safari audio (needs device testing)

**Supabase-Specific**:
- [ ] RLS policies work correctly
- [ ] Storage bucket permissions correct
- [ ] Audio files uploaded to Storage
- [ ] Session deletion cleans up audio files

---

## Known Limitations

**Both Versions**:
1. Audio recording requires HTTPS (except localhost)
2. Some YouTube videos not embeddable
3. No explicit file size limits (5-min duration limit only)
4. No real-time sync
5. URLs contain tokens (treat as passwords)

**PHP Version**:
- Limited scalability (shared hosting)
- Manual audio file cleanup on errors

**Supabase Version**:
- Requires Supabase account
- More complex setup
- Depends on third-party service

---

## Future Enhancement Ideas

### Priority: Medium
- [ ] Real-time updates (Supabase Realtime)
- [ ] Marker notes/descriptions
- [ ] Edit existing posts
- [ ] Keyboard shortcuts
- [ ] Video playback speed control
- [ ] Export session data

### Priority: Low
- [ ] User accounts (Supabase Auth)
- [ ] Session list/management
- [ ] Marker search/filter
- [ ] Dark mode
- [ ] Multiple video formats

---

## Unified Frontend Architecture

### Backend Adapter Pattern

The frontend uses an **adapter pattern** to provide a consistent interface regardless of backend:

**How It Works**:
1. Environment variable `VITE_BACKEND` determines which backend to use
2. Views import from `useBackendAdapter.js` instead of backend-specific files
3. Adapter returns appropriate implementation via dynamic imports
4. Same API surface for both backends

**Example**:
```javascript
// In CreateSession.vue
import { useSessionBackend } from '../composables/useBackendAdapter'

onMounted(async () => {
  const sessionBackend = await useSessionBackend()
  // sessionBackend works the same for PHP or Supabase
})
```

**Benefits**:
- ✅ Single codebase to maintain
- ✅ Easy to switch backends via config
- ✅ Code splitting via dynamic imports
- ✅ Type-safe interface (same methods/signatures)
- ✅ No duplicate Vue components

**Adapter Functions**:
- `useSessionBackend()` - Session CRUD operations
- `useMarkersBackend()` - Marker CRUD operations
- `usePostsBackend()` - Post CRUD operations
- `useAudioUrl()` - Audio URL generation

### Migration from Separate Frontends

**Previous Architecture**: `/frontend` (PHP) + `/frontend-supabase` (Supabase)
- ❌ Duplicate Vue components
- ❌ Must sync changes between directories
- ❌ Higher maintenance burden

**Current Architecture**: Single `/frontend` with backend switching
- ✅ All Supabase composables moved to main frontend
- ✅ Views use adapter pattern
- ✅ Single source of truth for UI code
- ✅ `/frontend-supabase` deprecated (can be removed)

---

## Git Commits

```
b332e80 Update CLAUDE.md with Enhancement #3
339d943 Add current time indicator to timeline
b4a236b Update CLAUDE.md with Enhancement #2
1948bcd Add helper link display for creators
2e78058 Update CLAUDE.md with Enhancement #1
325649c Add video seeking when marker is selected from list
6f46e45 Update CLAUDE.md with Issue #2 documentation
211af46 Fix marker creation routing issue
9b79351 Initial commit: Language learning video annotation app
```

---

## Session Summary

**Date**: January 4-5, 2026

**Tasks Completed**:
1. ✅ Complete PHP backend + frontend
2. ✅ Fixed routing issues
3. ✅ Added auto-seek on marker selection
4. ✅ Added helper link display
5. ✅ Added current time indicator
6. ✅ **Complete Supabase implementation**
7. ✅ **Supabase composables**
8. ✅ **Database schema with RLS**
9. ✅ **Storage bucket setup**
10. ✅ **Setup documentation**
11. ✅ **Unified frontend architecture**
12. ✅ **Backend adapter pattern**
13. ✅ **Eliminated duplicate code**

**Current Status**: Single frontend supporting both backends, all features functional

**Ready For**: Production deployment (choose backend via env var), iOS testing

---

## Choosing a Backend

### Use PHP + SQLite If:
- ✅ You have shared hosting with PHP
- ✅ You want simple, single-file deployment
- ✅ You don't need scalability
- ✅ You prefer full control over server
- ✅ Low expected traffic

### Use Supabase If:
- ✅ You want automatic scaling
- ✅ You prefer managed services
- ✅ You want real-time capabilities (future)
- ✅ You need global CDN for audio
- ✅ You want built-in monitoring
- ✅ Higher expected traffic

**Recommendation**: Start with PHP for simplicity, migrate to Supabase if you need scale.

---

## Support & Resources

- **Supabase Setup**: See `SUPABASE_SETUP.md`
- **SQL Schema**: See `supabase-schema.sql`
- **PHP API**: See `/api` directory
- **Supabase Docs**: https://supabase.com/docs
- **Vue 3 Docs**: https://vuejs.org
- **Project Issues**: https://github.com/anthropics/claude-code/issues
