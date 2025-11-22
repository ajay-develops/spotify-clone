-- Reset database and recreate policies from scratch
-- WARNING: This will delete ALL data from songs and liked_songs tables!

-- Step 1: Delete all data
DELETE FROM public.liked_songs;
DELETE FROM public.songs;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to songs" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to update own songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to delete own songs" ON public.songs;

DROP POLICY IF EXISTS "Users can view own liked songs" ON public.liked_songs;
DROP POLICY IF EXISTS "Users can insert own liked songs" ON public.liked_songs;
DROP POLICY IF EXISTS "Users can delete own liked songs" ON public.liked_songs;

-- Step 3: Recreate songs table policies from scratch
-- Policy 1: Allow everyone to read all songs
CREATE POLICY "Allow public read access to songs" ON public.songs
  FOR SELECT
  USING (true);

-- Policy 2: Allow all authenticated users to upload/insert songs
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Allow all authenticated users to delete songs (shared library)
CREATE POLICY "Allow authenticated users to delete songs" ON public.songs
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Step 4: Recreate liked_songs table policies from scratch
-- Policy 1: Users can view their own liked songs
CREATE POLICY "Users can view own liked songs" ON public.liked_songs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own liked songs
CREATE POLICY "Users can insert own liked songs" ON public.liked_songs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own liked songs
CREATE POLICY "Users can delete own liked songs" ON public.liked_songs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.songs TO authenticated;
GRANT SELECT ON public.songs TO anon;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.liked_songs TO authenticated;

-- Step 6: Verify policies were created
SELECT 
  tablename,
  policyname, 
  cmd, 
  roles
FROM pg_policies 
WHERE tablename IN ('songs', 'liked_songs')
ORDER BY tablename, cmd, policyname;

