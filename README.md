# Video Markup - Language Learning Annotation App

A collaborative web application for language learning through video annotation. Learners can watch YouTube videos, mark specific moments they don't understand, attach text or audio questions, and share a link with a native speaker who can respond with clarifications.

## Features

- 📺 **YouTube Video Integration** - Embed and watch any YouTube video
- 📍 **Point & Range Markers** - Mark specific moments or time ranges
- 💬 **Text & Audio Posts** - Ask questions via text or voice recordings
- 🎤 **Audio Level Monitoring** - Real-time feedback during recording with visual meter
- 📊 **Audio Waveform Visualization** - Interactive 100-bar waveform with click-to-seek
- 🔗 **Share Links** - Simple token-based sharing (creator & helper roles)
- 📱 **Mobile Responsive** - Works on desktop and mobile devices with optimized UX
- 🎯 **Timeline Visualization** - Visual timeline showing all markers and current playback position
- 💬 **WhatsApp-Style Messaging** - Familiar message bubbles with dynamic input interface
- 🔄 **Two Backend Options** - Choose between PHP/SQLite or Supabase

## Tech Stack

### Frontend (Unified)
- Vue 3 (Composition API)
- Vite
- Howler.js (audio playback)
- lamejs (MP3 encoding for iOS compatibility)
- YouTube IFrame API
- **Backend Adapter Pattern** - Single codebase supporting both backends

### Backend Options

#### Option 1: PHP + SQLite
- PHP 8+ with built-in server or Apache
- SQLite database (auto-created)
- Local file storage for audio
- **Best for**: Simple deployment, low traffic, full control

#### Option 2: Supabase
- PostgreSQL database (cloud)
- Supabase Storage (CDN)
- Row Level Security (RLS) policies
- Auto-generated REST API
- **Best for**: Auto-scaling, managed services, higher traffic

---

## Quick Start

### Prerequisites

- **Node.js 18+** (for frontend)
- **PHP 8+** (only if using PHP backend)
- **Supabase account** (only if using Supabase backend)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd video-markup
```

### 2. Choose Your Backend

The app supports both backends with a single frontend. Choose one:

- **[Setup with PHP Backend](#setup-with-php-backend)** (recommended for beginners)
- **[Setup with Supabase Backend](#setup-with-supabase-backend)** (recommended for production)

---

## Setup with PHP Backend

### Step 1: Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_BACKEND=php
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Start the Backend (Terminal 1)

```bash
cd ..
php -S localhost:8000 server/router.php
```

The PHP server will:
- Auto-create `database.sqlite` on first run
- Auto-create `/audio` directory for audio files
- Serve API endpoints on `http://localhost:8000`

### Step 4: Start the Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

### Step 5: Open the App

Frontend available at: **http://localhost:5173**

### Done! 🎉

You can now:
1. Paste a YouTube URL to create a session
2. Add markers while watching the video
3. Record audio or type text messages
4. Share the helper link with your language partner

---

## Setup with Supabase Backend

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/log in
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait ~2 minutes for the project to initialize

### Step 2: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this repo
4. Paste and click "Run"

This creates:
- `sessions`, `markers`, and `posts` tables
- Row Level Security (RLS) policies
- Database function for efficient session retrieval
- Indexes for performance

### Step 3: Set Up Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click "New Bucket"
3. Name it `audio`
4. Make it **public**
5. Click on the `audio` bucket
6. Go to "Policies" tab
7. Create the following policies:

**Policy 1: Allow public reads**
- Name: `Public audio access`
- Allowed operation: `SELECT`
- Policy definition: `true`

**Policy 2: Allow authenticated inserts**
- Name: `Allow audio uploads`
- Allowed operation: `INSERT`
- Policy definition: `true`

**Policy 3: Allow authenticated deletes**
- Name: `Allow audio deletes`
- Allowed operation: `DELETE`
- Policy definition: `true`

> **Note**: For detailed setup instructions, see `SUPABASE_SETUP.md`

### Step 4: Get API Credentials

1. Go to **Settings** → **API** in Supabase Dashboard
2. Copy your:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 5: Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 6: Install Frontend Dependencies

```bash
npm install
```

### Step 7: Start the Frontend

```bash
npm run dev
```

### Step 8: Open the App

Frontend available at: **http://localhost:5173**

### Done! 🎉

You can now use the app with Supabase as the backend!

---

## Usage Guide

### Creating a Session

1. Open the app in your browser
2. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Click "Create Session"
4. You'll get two URLs:
   - **Creator URL** - Full access (create/delete markers and posts)
   - **Helper URL** - Reply-only access (can only add posts, not delete)

**Important**: Save both URLs! There's no session list, these are your only way back.

### Adding Markers

**Point Marker** (single moment in time):
1. Play the video to the desired timestamp
2. Click "Mark Current Time" button
3. The marker appears on the timeline

**Range Marker** (time range):
1. Play to the start point
2. Click "Start Range"
3. Play to the end point
4. Click "End Range"
5. The range marker appears on the timeline

**Deleting Markers** (creator only):
- Click the "Delete" button on any marker card
- This also deletes all posts in that marker's thread

### Adding Posts

1. Click on any marker in the timeline or sidebar
2. The thread panel opens on the right
3. Add your message:
   - Type text in the text area (optional)
   - Click "Start Recording" to record audio (optional)
   - Or do both!
4. Click "Save Post"

**Audio Recording**:
- Max duration: 5 minutes (auto-stops)
- Click "Stop Recording" when done
- Preview your recording before saving
- Audio is encoded to MP3 for iOS compatibility

### Sharing with a Language Partner

1. Copy the **Helper URL** (shown after creating a session)
2. Send it to your language partner via email, chat, etc.
3. They can view all markers and add replies
4. They cannot delete markers or the session

### Timeline Features

- **Visual markers**: See all point and range markers
- **Current time indicator**: Black line shows playback position
- **Click to seek**: Click any marker to jump to that timestamp
- **Color coding**: Different colors for point vs range markers

---

## Project Structure

```
video-markup/
├── frontend/               # Vue 3 frontend (unified)
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── VideoPlayer.vue
│   │   │   ├── MarkerTimeline.vue
│   │   │   ├── MarkerList.vue
│   │   │   ├── ThreadPanel.vue
│   │   │   ├── AudioRecorder.vue
│   │   │   └── AudioPlayer.vue
│   │   ├── composables/    # Backend adapters
│   │   │   ├── useBackendAdapter.js  # Unified interface
│   │   │   ├── useApi.js             # PHP implementation
│   │   │   ├── useSupabase*.js       # Supabase implementation
│   │   │   └── useAudioRecorder.js   # Shared audio logic
│   │   ├── views/
│   │   │   ├── CreateSession.vue
│   │   │   └── Session.vue
│   │   └── styles.css
│   ├── .env.example        # Environment config template
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # PHP backend
│   ├── api/                # API endpoints
│   │   ├── endpoints/
│   │   │   ├── sessions.php    # Session CRUD
│   │   │   ├── markers.php     # Marker CRUD
│   │   │   ├── posts.php       # Post creation
│   │   │   └── audio.php       # Audio serving
│   │   ├── lib/
│   │   │   ├── db.php          # SQLite database
│   │   │   └── auth.php        # Token validation
│   │   └── index.php           # API router
│   ├── config.php          # PHP configuration
│   └── router.php          # PHP dev server router
│
├── audio/                  # PHP uploaded files (auto-created)
├── database.sqlite         # SQLite database (auto-created)
├── supabase-schema.sql     # Supabase database schema
├── SUPABASE_SETUP.md       # Detailed Supabase guide
├── CLAUDE.md               # Development log
└── README.md               # This file
```

---

## Switching Backends

You can switch backends anytime by changing the `.env` file:

```bash
cd frontend

# Edit .env and change VITE_BACKEND to 'php' or 'supabase'
# Also add Supabase credentials if switching to Supabase

npm run dev
```

**Note**: Sessions are backend-specific. A session created with PHP won't be accessible when using Supabase, and vice versa (separate databases).

---

## Backend Comparison

| Feature | PHP + SQLite | Supabase |
|---------|--------------|----------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐⭐ Moderate |
| **Setup Time** | 5 minutes | 15-20 minutes |
| **Hosting Cost** | Shared hosting (~$5/mo) | Free tier, then usage-based |
| **Scalability** | Limited (single server) | Auto-scaling (cloud) |
| **Database** | SQLite file | PostgreSQL |
| **Storage** | Local filesystem | CDN with global distribution |
| **Auth Method** | PHP token validation | Row Level Security (RLS) |
| **Real-time** | ❌ Not available | ✅ Built-in (not implemented) |
| **Deployment** | Shared hosting/VPS | Static hosting (Vercel, Netlify) |
| **Dependencies** | PHP 8+ only | Supabase account required |
| **Data Control** | ✅ Full control | ⚠️ Depends on Supabase |

**Recommendation**:
- Start with **PHP** for simplicity and learning
- Migrate to **Supabase** when you need scale or don't want to manage a server

---

## Security Model

Both backends use a **"share link" security model**:

### How It Works
1. Each session gets two unique tokens (UUIDs)
2. Tokens are embedded in URLs: `/session/{id}?token={token}`
3. Backend validates token to determine role (creator/helper)
4. Roles control permissions:
   - **Creator**: Can create/delete markers, create/delete posts, delete session
   - **Helper**: Can only create posts (read-only for markers)

### What It Protects
- ✅ Prevents random access (need valid token)
- ✅ Prevents helpers from deleting content
- ✅ Simple, no password management required
- ✅ Easy sharing (just send a URL)

### Limitations
- ❌ Anyone with URL has access
- ❌ No token revocation without deleting entire session
- ❌ No audit trail of who accessed what
- ❌ URLs should be treated as passwords (don't share publicly)

**Similar To**: Google Docs share links, Dropbox sharing, Figma collaborative links

---

## API Endpoints (PHP Backend)

```
POST   /api/sessions              Create session
GET    /api/sessions/{id}         Get session (requires token)
DELETE /api/sessions/{id}         Delete session (creator only)

POST   /api/sessions/{id}/markers Create marker
DELETE /api/markers/{id}          Delete marker (creator only)

POST   /api/markers/{id}/posts    Create post
GET    /api/audio/{filename}      Get audio file
```

All authenticated endpoints require `?token={token}` query parameter.

---

## Database Schema

### sessions
- `id` - Unique session identifier (TEXT for PHP, UUID for Supabase)
- `youtube_url` - Original YouTube URL
- `youtube_title` - Video title (from oEmbed)
- `youtube_thumbnail` - Thumbnail URL
- `creator_token` - Authentication token for creator (UUID)
- `helper_token` - Authentication token for helper (UUID)
- `created_at` - Timestamp

### markers
- `id` - Auto-increment ID
- `session_id` - Foreign key to sessions
- `start_time` - Timestamp in seconds (REAL)
- `end_time` - End timestamp for ranges (NULL for point markers)
- `created_at` - Timestamp

### posts
- `id` - Auto-increment ID
- `marker_id` - Foreign key to markers
- `author_type` - 'creator' or 'helper'
- `text_content` - Text content (optional, TEXT)
- `audio_filename` - Audio file name (PHP) or path (Supabase)
- `created_at` - Timestamp

**Key Differences Between Backends**:
- PHP uses TEXT IDs for sessions, Supabase uses UUIDs
- PHP uses `audio_filename`, Supabase uses `audio_path` (storage path)
- Supabase has Row Level Security policies on all tables

---

## Deployment

### Deploying PHP Backend

**Option A: Shared Hosting (Apache)**

1. Upload all files to your hosting directory
2. Ensure `.htaccess` is present (already included)
3. Ensure PHP 8+ is enabled
4. Set permissions:
```bash
chmod 755 audio
chmod 644 database.sqlite  # After first run
```
5. The app will be available at your domain

**Option B: VPS (Nginx)**

1. Install PHP 8+ and enable required extensions
2. Configure Nginx to proxy `/api/*` to PHP
3. Point document root to `frontend/dist/` (after building)
4. Set proper permissions for `audio/` and database

**Environment**: Production deployment automatically uses built frontend from `frontend/dist/`

### Deploying Supabase Frontend

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy `dist/` folder to your hosting:
   - **Vercel**: Connect GitHub repo, set build command to `cd frontend && npm install && npm run build`
   - **Netlify**: Drag and drop `dist/` folder or connect repo
   - **Cloudflare Pages**: Connect repo, set build directory to `frontend/dist`

3. Set environment variables in your hosting platform:
```
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Configure SPA routing (for Vercel, add `vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Troubleshooting

### "API error terminated" or JSON parse errors

**Cause**: PHP server crashed or `config.php` not loaded properly

**Fix**: Restart the PHP server
```bash
pkill -f "php -S"
cd /path/to/video-markup
php -S localhost:8000 server/router.php
```

### Audio recording doesn't work

**Cause**: MediaRecorder API requires HTTPS (except localhost)

**Fix**:
- Development: Use `localhost` (already HTTPS-exempt)
- Production: Enable HTTPS on your hosting

### YouTube video won't embed

**Cause**: Some videos have embedding disabled by the owner

**Fix**: Try a different video URL. Age-restricted and private videos also won't work.

### Supabase RLS errors ("new row violates row-level security policy")

**Cause**: Token not properly extracted or RLS policies missing

**Fix**:
1. Check that token is in URL: `/session/{id}?token={token}`
2. Verify RLS policies were created (run `supabase-schema.sql`)
3. Check browser console for token extraction errors

### "Marker overlaps with existing range"

**Cause**: Trying to create a range marker that overlaps with an existing range

**Fix**: Choose a different time range, or delete the overlapping marker first

### Database not created (PHP)

**Cause**: PHP doesn't have write permissions

**Fix**:
```bash
chmod 755 .
touch database.sqlite
chmod 644 database.sqlite
```

---

## Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
```

### PHP Backend Development

```bash
# Start PHP development server
php -S localhost:8000 server/router.php

# Check PHP error logs
tail -f /tmp/php-server.log
```

### Adding New Features

1. **Backend (PHP)**: Add endpoints in `/api/endpoints/`
2. **Backend (Supabase)**: Update schema, add to composables
3. **Frontend**: Update adapter in `useBackendAdapter.js`
4. **UI**: Create/modify components in `/frontend/src/components/`

### Architecture: Backend Adapter Pattern

The frontend uses a unified adapter pattern:

```javascript
// In any Vue component
import { useSessionBackend } from '@/composables/useBackendAdapter'

const sessionBackend = await useSessionBackend()
// Works the same for PHP or Supabase!
await sessionBackend.createSession(url)
```

The adapter:
- Checks `VITE_BACKEND` environment variable
- Dynamically imports the correct implementation
- Provides the same API surface for both backends
- Enables code splitting (only loads needed backend code)

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari (iOS) | 14+ | ✅ Full support (with lamejs MP3 encoding) |
| Chrome Mobile | Latest | ✅ Full support |

**Requirements**:
- `MediaRecorder` API for audio recording
- `navigator.clipboard` API for copy-to-clipboard
- ES6+ JavaScript support

---

## Testing Checklist

- [ ] Create session with various YouTube URL formats
- [ ] Creator URL provides full access
- [ ] Helper URL is read-only for markers
- [ ] Create point markers at different timestamps
- [ ] Create range markers
- [ ] Range overlap prevention works
- [ ] Delete markers (creator only)
- [ ] Delete session (creator only)
- [ ] Timeline shows all markers correctly
- [ ] Current time indicator moves during playback
- [ ] Click marker to seek video
- [ ] Add text-only posts
- [ ] Record and save audio posts
- [ ] Play audio from posts
- [ ] Mixed text + audio posts
- [ ] Unicode support (test with non-English text)
- [ ] Mobile responsive layout
- [ ] Helper link copy-to-clipboard
- [ ] iOS Safari audio recording (requires device testing)

---

## Contributing

This is a personal project, but suggestions and bug reports are welcome! Feel free to:
- Open issues for bugs
- Suggest features
- Submit pull requests

---

## License

MIT License - feel free to use this for your own language learning projects!

---

## Support & Resources

- **Supabase Setup Guide**: See `SUPABASE_SETUP.md` for detailed Supabase instructions
- **Development Log**: See `CLAUDE.md` for full implementation history
- **Backend Comparison**: See `BACKEND_COMPARISON.md` for detailed comparison

---

## Credits

Built with ❤️ using [Claude Code](https://claude.com/claude-code)

**Developed**: January 2026
