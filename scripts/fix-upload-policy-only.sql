-- Fix ONLY the INSERT policy for songs table (for uploads)
-- This is the minimal script to fix the upload issue

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;

-- Create a new INSERT policy that allows all authenticated users to insert songs
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure proper permissions
GRANT INSERT ON public.songs TO authenticated;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

-- Verify the policy was created
SELECT 
  policyname, 
  cmd, 
  roles, 
  with_check 
FROM pg_policies 
WHERE tablename = 'songs' 
  AND cmd = 'INSERT';

