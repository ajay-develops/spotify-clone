-- Fix RLS policy for songs table to allow authenticated users to upload songs
-- This fixes the "new row violates row-level security policy" error

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;

-- Create a new INSERT policy that explicitly allows authenticated users
-- This policy allows any authenticated user to insert songs with their own user_id
CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Alternative simpler policy if the above doesn't work
-- Uncomment this and comment the above if needed:
-- DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;
-- CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'songs' AND cmd = 'INSERT';

-- Ensure proper permissions are granted
GRANT INSERT ON public.songs TO authenticated;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

