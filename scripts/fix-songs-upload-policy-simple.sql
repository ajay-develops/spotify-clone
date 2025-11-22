-- Simple fix for RLS policy - allows all authenticated users to insert songs
-- Use this if the other policy doesn't work

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;

-- Create a simple policy that allows authenticated users to insert songs
-- This policy allows any authenticated user to insert songs
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure proper permissions are granted
GRANT INSERT ON public.songs TO authenticated;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

-- Verify it was created
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'songs' AND cmd = 'INSERT';

