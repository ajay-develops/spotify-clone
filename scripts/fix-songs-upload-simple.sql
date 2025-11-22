-- Simple fix for songs table upload issue
-- Run this script to fix the "new row violates row-level security policy" error

-- Step 1: Drop the existing INSERT policy (if it exists)
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;

-- Step 2: Create a new INSERT policy that allows all authenticated users
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Grant necessary permissions
GRANT INSERT ON public.songs TO authenticated;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

-- Done! The upload should work now.

