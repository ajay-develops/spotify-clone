-- Update songs table policies to ensure:
-- 1. All authenticated users can upload songs
-- 2. All songs are visible to everyone (public access)
-- 3. Songs are shared across all users

-- Drop existing policies if they exist (to recreate them cleanly)
-- Note: Use DROP IF EXISTS to avoid errors if policies don't exist
DROP POLICY IF EXISTS "Allow public read access to songs" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to update own songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to delete own songs" ON public.songs;

-- Policy 1: Allow everyone (public and authenticated) to read all songs
CREATE POLICY "Allow public read access to songs" ON public.songs
  FOR SELECT
  USING (true);

-- Policy 2: Allow all authenticated users to upload/insert songs
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Optional: Allow authenticated users to update their own songs
-- Uncomment if you want users to be able to edit songs they uploaded
-- DROP POLICY IF EXISTS "Allow users to update own songs" ON public.songs;
-- CREATE POLICY "Allow users to update own songs" ON public.songs
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- Optional: Allow authenticated users to delete their own songs
-- Uncomment if you want users to be able to delete songs they uploaded
-- DROP POLICY IF EXISTS "Allow users to delete own songs" ON public.songs;
-- CREATE POLICY "Allow users to delete own songs" ON public.songs
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON public.songs TO authenticated;

-- Grant SELECT permission to anon (public) users so they can read songs
GRANT SELECT ON public.songs TO anon;

-- Note: The liked_songs table policies are already correct:
-- - Users can only view their own liked songs
-- - Users can only like/unlike songs for themselves
-- - This ensures favorites are user-specific

