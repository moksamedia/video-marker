# Language Learning Video Annotation App

A web application for collaborative language learning through video annotation. Learners can watch YouTube videos, mark specific moments they don't understand, and share with native speakers who can respond with clarifications via text or audio.

## Features

- **YouTube Video Integration**: Embed and control YouTube videos
- **Point & Range Markers**: Create markers at specific timestamps or time ranges
- **Threaded Discussions**: Each marker has its own thread of text/audio posts
- **Audio Recording**: Record up to 5 minutes of audio with iOS Safari compatibility
- **Role-Based Access**: Creator (full access) and Helper (reply-only) URLs
- **Mobile Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Vue.js 3 (Composition API), Vite
- **Backend**: PHP 8+ with SQLite
- **Audio**: Howler.js (playback), MediaRecorder API + lamejs (recording)
- **Deployment**: Standard shared hosting (Apache/PHP)

## Project Structure

```
/video-markup
  /api
    /endpoints      # API endpoint handlers
    /lib            # Database and auth helpers
    index.php       # API router
  /audio            # Uploaded audio files
  /frontend
    /src
      /components   # Vue components
      /composables  # Reusable logic
      /views        # Page views
  database.sqlite   # SQLite database (created automatically)
  .htaccess         # Apache routing rules
```

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Development Mode

For development, run both the PHP backend and Vite dev server:

**Terminal 1 - PHP Backend:**
```bash
# From project root
php -S localhost:8000 router.php
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Production Build

Build the frontend for production:

```bash
cd frontend
npm run build
```

This creates optimized files in `frontend/dist/`

### 4. Deploy to Shared Hosting

1. Upload all files to your hosting directory
2. Ensure the `.htaccess` file is present
3. Set permissions:
   ```bash
   chmod 755 audio
   chmod 644 database.sqlite  # After first API request creates it
   ```
4. Ensure PHP 8+ is enabled on your hosting
5. The app will be available at your domain

## Configuration

Edit `config.php` to change settings:

- `DB_PATH`: Database file location
- `AUDIO_DIR`: Audio files directory
- `MAX_AUDIO_DURATION`: Maximum recording length (seconds)
- `CORS_ORIGIN`: CORS settings (change in production)

## How It Works

### Creating a Session

1. Visit the homepage
2. Paste a YouTube URL
3. Get two unique URLs:
   - **Creator URL**: Full access (create/delete markers, post, delete session)
   - **Helper URL**: Reply access (view markers, post replies)

### Using Markers

- **Point Marker**: Click "Add Point Marker" at current timestamp
- **Range Marker**: Click "Start Range", play to end point, click "End Range"
- Markers appear on the timeline and in the sidebar
- Click any marker to view its thread

### Adding Posts

- Select a marker to open its thread
- Type text and/or record audio
- Both creator and helper can add posts
- Posts are visually differentiated by author type

### Audio Recording

- Click "Start Recording" to begin
- Recording auto-stops at 5 minutes
- Preview before saving
- Audio is encoded to MP3 client-side for iOS compatibility

## API Endpoints

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/{id}?token={token}` - Get session data
- `DELETE /api/sessions/{id}?token={token}` - Delete session (creator only)

### Markers
- `POST /api/sessions/{id}/markers?token={token}` - Create marker
- `DELETE /api/markers/{id}?token={token}` - Delete marker (creator only)

### Posts
- `POST /api/markers/{id}/posts?token={token}` - Add post (multipart form)

### Audio
- `GET /api/audio/{filename}` - Serve audio file

## Database Schema

### sessions
- `id`: Unique session identifier
- `youtube_url`: Original YouTube URL
- `youtube_title`: Video title (from oEmbed)
- `youtube_thumbnail`: Thumbnail URL
- `creator_token`: Authentication token for creator
- `helper_token`: Authentication token for helper
- `created_at`: Timestamp

### markers
- `id`: Auto-increment ID
- `session_id`: Foreign key to sessions
- `start_time`: Timestamp in seconds
- `end_time`: End timestamp (NULL for point markers)
- `created_at`: Timestamp

### posts
- `id`: Auto-increment ID
- `marker_id`: Foreign key to markers
- `author_type`: 'creator' or 'helper'
- `text_content`: Text content (optional)
- `audio_filename`: Audio file name (optional)
- `created_at`: Timestamp

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Firefox Mobile

Audio recording requires HTTPS in production (except localhost).

## Security Notes

- Tokens provide access control (keep URLs private)
- No user accounts required
- Sessions persist until manually deleted
- Audio files stored server-side with unique filenames
- SQL injection protected via prepared statements
- File upload validation for audio files

## Troubleshooting

### YouTube video not loading
- Check the URL format
- Ensure the video is not age-restricted or private
- YouTube oEmbed API may block some videos

### Audio recording not working
- Ensure HTTPS (required except on localhost)
- Grant microphone permissions
- Check browser console for errors

### Database not created
- Ensure PHP has write permissions in the project directory
- Check PHP error logs

### Markers overlapping
- The UI prevents creating overlapping range markers
- If you see this error, another range already exists in that time period

## Development

### Adding New Features

1. **Backend**: Add endpoints in `/api/endpoints/`
2. **Frontend**: Create components in `/frontend/src/components/`
3. **API Client**: Update `/frontend/src/composables/useApi.js`

### Styling

- Global styles in `/frontend/src/styles.css`
- Component styles in each `.vue` file's `<style>` section

## License

MIT License - feel free to use and modify for your projects.

## Support

For issues or questions, check:
- Browser console for frontend errors
- PHP error logs for backend issues
- Network tab for API request/response details
