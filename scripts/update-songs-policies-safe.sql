-- Safe update for songs table policies
-- This script drops existing policies first, then recreates them

-- Step 1: Drop existing policies (run these first if they exist)
DROP POLICY IF EXISTS "Allow public read access to songs" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to update own songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to delete own songs" ON public.songs;

-- Step 2: Create the policies fresh
-- Policy 1: Allow everyone (public and authenticated) to read all songs
CREATE POLICY "Allow public read access to songs" ON public.songs
  FOR SELECT
  USING (true);

-- Policy 2: Allow all authenticated users to upload/insert songs
-- This is the main fix for the upload issue - allows any authenticated user
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Grant necessary permissions
GRANT SELECT, INSERT ON public.songs TO authenticated;
GRANT SELECT ON public.songs TO anon;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

-- Step 4: Verify policies were created
SELECT 
  policyname, 
  cmd, 
  roles, 
  with_check 
FROM pg_policies 
WHERE tablename = 'songs'
ORDER BY cmd, policyname;

