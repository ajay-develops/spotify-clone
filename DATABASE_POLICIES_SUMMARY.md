# Database Policies Summary

## Current Configuration

### ✅ Songs Table - Shared Library
All songs are **shared across all users**:
- **Public Read Access**: Everyone (including unauthenticated users) can see all songs
- **Authenticated Upload**: Any authenticated user can upload songs
- **All Songs Visible**: When a user uploads a song, it becomes available to everyone

**Policies:**
- `Allow public read access to songs` - Everyone can SELECT/view songs
- `Allow authenticated users to insert songs` - Authenticated users can INSERT/upload songs

### ✅ Liked Songs Table - User-Specific Favorites
Liked songs are **private to each user**:
- **Personal View**: Users can only see their own liked songs
- **Personal Actions**: Users can only like/unlike songs for themselves
- **User-Specific**: Each user has their own separate list of favorite songs

**Policies:**
- `Users can view own liked songs` - Users can only SELECT their own liked songs
- `Users can insert own liked songs` - Users can only INSERT likes for themselves
- `Users can delete own liked songs` - Users can only DELETE their own likes

## How It Works

1. **Uploading Songs**:
   - Any authenticated user can upload a song
   - The uploaded song is immediately visible to all users (including anonymous/public users)
   - The `user_id` field stores who uploaded it, but doesn't restrict visibility

2. **Viewing Songs**:
   - All users see the same shared library of songs
   - Songs are displayed in reverse chronological order (newest first)
   - No filtering by user - everyone sees everything

3. **Liking Songs**:
   - Each user can like any song from the shared library
   - Likes are stored in the `liked_songs` table with `user_id` and `song_id`
   - Each user sees only their own liked songs in the "Favorites" section

## SQL Scripts to Apply

### If policies are not set up correctly:

1. **Run `scripts/update-songs-policies.sql`** - Ensures songs are shared and uploadable by all authenticated users

2. **Verify `scripts/create-liked-songs-table.sql` has been run** - Ensures liked songs are user-specific

### To Verify Current Policies:

Run this SQL query in Supabase SQL Editor:
```sql
-- Check songs table policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'songs'
ORDER BY policyname;

-- Check liked_songs table policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'liked_songs'
ORDER BY policyname;
```

## Storage Bucket Policies

Make sure your storage buckets (`songs` and `images`) have policies that allow:
- **Authenticated users** to upload files (INSERT)
- **Public/anonymous users** to read files (SELECT)

This is typically configured in Supabase Dashboard → Storage → Policies.

