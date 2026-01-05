# Video Markup App - Supabase Backend

This is the Supabase-powered version of the Language Learning Video Annotation app. It uses Supabase for PostgreSQL database, authentication, and file storage instead of PHP/SQLite.

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works fine)

### 2. Supabase Setup

Follow the detailed setup guide in `../SUPABASE_SETUP.md` to:
1. Create a Supabase project
2. Run the database schema (`../supabase-schema.sql`)
3. Create the audio storage bucket
4. Get your API credentials

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Differences from PHP Version

### Backend
- **Database**: PostgreSQL instead of SQLite
- **Storage**: Supabase Storage instead of local filesystem
- **Auth**: Row Level Security (RLS) policies instead of PHP token validation
- **API**: Supabase auto-generated REST API instead of custom PHP endpoints

### Frontend
- **Composables**: New Supabase-specific composables instead of PHP API client
- **Components**: Same Vue components as PHP version (minimal changes)
- **Tokens**: Extracted from URL and passed as headers to Supabase

### Advantages of Supabase Version
- ✅ Real-time capabilities (could add live updates)
- ✅ Automatic API generation
- ✅ Better scalability
- ✅ Built-in CDN for audio files
- ✅ Integrated monitoring and logs
- ✅ No server management needed

### Features Retained
- ✅ Token-based session access (creator/helper roles)
- ✅ YouTube video embedding
- ✅ Point and range markers
- ✅ Text and audio posts
- ✅ Audio recording with lamejs (iOS compatible)
- ✅ Mobile responsive design

## Project Structure

```
frontend-supabase/
├── src/
│   ├── components/        # Vue components (copied from original)
│   │   ├── VideoPlayer.vue
│   │   ├── MarkerTimeline.vue
│   │   ├── MarkerList.vue
│   │   ├── ThreadPanel.vue
│   │   ├── AudioRecorder.vue
│   │   └── AudioPlayer.vue
│   ├── composables/       # Supabase-specific composables
│   │   ├── useSupabase.js           # Supabase client setup
│   │   ├── useSupabaseSession.js    # Session CRUD
│   │   ├── useSupabaseMarkers.js    # Marker CRUD
│   │   ├── useSupabasePosts.js      # Post CRUD
│   │   ├── useAudioStorage.js       # Supabase Storage
│   │   └── useAudioRecorder.js      # Audio recording (same as PHP version)
│   ├── views/
│   │   ├── CreateSession.vue
│   │   └── Session.vue
│   ├── App.vue
│   ├── main.js
│   ├── router.js
│   └── styles.css         # Same as PHP version
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

## Key Implementation Details

### Token Handling

Tokens are extracted from URL query params and used for Row Level Security:

```javascript
// In Session.vue
const token = route.query.token

// Used in all Supabase operations
await createMarker(sessionId, token, startTime, endTime)
```

### RLS Policies

Database queries are automatically filtered by RLS policies based on the token:

```sql
-- Example: Only creator can delete sessions
CREATE POLICY "Creator can delete session" ON sessions
    FOR DELETE
    USING (
        creator_token::text = current_setting('request.jwt.claims', true)::json->>'session_token'
    );
```

### Audio Upload Flow

1. Record audio using MediaRecorder API
2. Encode to MP3 using lamejs (client-side)
3. Upload to Supabase Storage bucket
4. Store path in `posts.audio_path`
5. Generate public URL for playback

### Database Function

The `get_session_with_role` function efficiently fetches complete session data:

```javascript
const { data } = await supabase.rpc('get_session_with_role', {
  p_session_id: sessionId,
  p_token: token
})

// Returns: { id, youtube_url, role, markers: [...], helper_token (if creator) }
```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `VITE_BACKEND=supabase`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Other Hosts

Any static hosting works (GitHub Pages, Cloudflare Pages, etc.)

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists and has correct values
- Restart dev server after changing `.env`

### "Session not found or invalid token"
- Verify token is in the URL (`?token=xxx`)
- Check that session exists in Supabase Table Editor
- Verify RLS policies are created

### Audio upload fails
- Check that `audio` storage bucket exists
- Verify bucket is set to public
- Check storage policies are correct

### YouTube video not loading
- Some videos cannot be embedded (age-restricted, private)
- Check browser console for errors

## Testing

1. **Create Session**: Paste a YouTube URL, should create session and show URLs
2. **Creator Functions**: Test creating markers, posts, deleting markers
3. **Helper Functions**: Open helper URL, try creating markers (should fail), try posting (should work)
4. **Audio**: Record and upload audio, verify it appears in Supabase Storage
5. **Delete Session**: Delete session, verify everything cascades (check database and storage)

## Migration from PHP Version

If you have existing data in the PHP/SQLite backend:

1. Export sessions, markers, posts from SQLite
2. Convert UUIDs for sessions (PHP uses hex strings, Supabase uses UUIDs)
3. Import into Supabase via SQL
4. Manually upload audio files to Supabase Storage
5. Update `posts.audio_path` to match new paths

## Support

- Supabase Docs: https://supabase.com/docs
- Vue 3 Docs: https://vuejs.org
- Project Issues: https://github.com/anthropics/claude-code/issues

## License

MIT
