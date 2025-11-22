-- Add DELETE policy for songs table
-- This allows authenticated users to delete songs

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to delete songs" ON public.songs;

-- Create delete policy - allow all authenticated users to delete songs
-- Since this is a shared library, all authenticated users can delete any song
CREATE POLICY "Allow authenticated users to delete songs" ON public.songs
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Grant DELETE permission
GRANT DELETE ON public.songs TO authenticated;

-- Verify the policy was created
SELECT 
  policyname, 
  cmd, 
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'songs' AND cmd = 'DELETE';

