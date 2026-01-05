# Supabase Backend Setup Guide

This guide will help you set up the Supabase backend for the Video Markup application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name**: video-markup (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy and paste the schema from `supabase-schema.sql`
4. Click "Run" to execute

The schema creates:
- `sessions` table with creator/helper tokens
- `markers` table with foreign key to sessions
- `posts` table with foreign key to markers
- Indexes for performance
- Row Level Security (RLS) policies for token-based access

## Step 3: Create Storage Bucket

### Option A: Using SQL Editor

1. In SQL Editor, run:

```sql
-- Create audio bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true);

-- Storage policy: anyone can read audio files
CREATE POLICY "Public audio access" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio');

-- Storage policy: allow uploads
CREATE POLICY "Allow audio uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio');

-- Storage policy: allow deletes
CREATE POLICY "Allow audio deletes" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio');
```

### Option B: Using Dashboard

1. Go to **Storage** in left sidebar
2. Click "Create a new bucket"
3. Name it `audio`
4. Make it **Public**
5. Click "Create bucket"
6. Go to **Storage Policies** and add the policies above via SQL

## Step 4: Get API Credentials

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** tab
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 5: Configure Frontend

1. In the `frontend-supabase` directory, create `.env` file:

```bash
cd frontend-supabase
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 6: Install Dependencies and Run

```bash
cd frontend-supabase
npm install
npm run dev
```

The app should now be running on `http://localhost:5173` using Supabase!

## Verification

To verify everything is set up correctly:

1. **Create a test session**:
   - Open the app
   - Paste a YouTube URL
   - Click "Create Session"
   - You should see creator and helper URLs

2. **Check database**:
   - Go to **Table Editor** in Supabase
   - Click `sessions` table
   - You should see your new session

3. **Test markers**:
   - Use the creator URL
   - Try creating a point marker
   - Check the `markers` table in Supabase

4. **Test audio**:
   - Record a short audio clip
   - Check **Storage** → `audio` bucket
   - You should see the uploaded file

## Troubleshooting

### "Failed to create session"
- Check that your Supabase URL and anon key are correct in `.env`
- Verify the schema was created (check Table Editor)

### "Invalid token" errors
- Verify RLS policies were created correctly
- Check that tokens are being passed in headers (open browser DevTools → Network tab)

### Audio upload fails
- Verify the `audio` bucket exists and is public
- Check storage policies are set correctly

### YouTube oEmbed fails
- This is a frontend API call, not related to Supabase
- Some videos may not be embeddable (age-restricted, private, etc.)

## Database Functions

The `get_session_with_role` function is used to fetch complete session data with the user's role. This is more efficient than multiple queries.

To view it:
1. Go to **Database** → **Functions**
2. You should see `get_session_with_role`

## Monitoring

- **Database**: View tables in **Table Editor**
- **Storage**: View files in **Storage**
- **Logs**: Check **Logs** for errors
- **API**: Monitor usage in **Project Settings** → **API**

## Security Notes

1. **Never commit `.env` file** - it contains your anon key
2. **RLS is enabled** - all queries go through Row Level Security policies
3. **Tokens in URLs** - treat creator/helper URLs as sensitive (like passwords)
4. **Public storage** - audio files are publicly accessible (anyone with URL can listen)

## Migration from PHP Backend

If you have existing data in the PHP/SQLite backend and want to migrate:

1. Export data from SQLite:
```bash
sqlite3 database.sqlite .dump > backup.sql
```

2. Convert to PostgreSQL format (manual process - UUID generation, timestamp formats)
3. Import to Supabase via SQL Editor

Note: Audio files in `/audio` directory need to be uploaded to Supabase Storage bucket manually or via script.

## Next Steps

- Set up production deployment (Vercel, Netlify, etc.)
- Add custom domain
- Monitor usage and scale as needed
- Consider adding email notifications (Supabase Auth + triggers)

## Support

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/anthropics/claude-code/issues (for this app)
