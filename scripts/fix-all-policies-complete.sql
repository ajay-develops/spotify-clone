-- Complete Fix: Database + Storage Policies
-- This script fixes ALL policies needed for song uploads to work

-- ========================================
-- PART 1: Database Table Policies
-- ========================================

-- Drop existing songs table policies
DROP POLICY IF EXISTS "Allow public read access to songs" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated users to insert songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to update own songs" ON public.songs;
DROP POLICY IF EXISTS "Allow users to delete own songs" ON public.songs;

-- Create songs table policies
CREATE POLICY "Allow public read access to songs" ON public.songs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions for songs table
GRANT SELECT, INSERT ON public.songs TO authenticated;
GRANT SELECT ON public.songs TO anon;
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;

-- Drop existing liked_songs table policies
DROP POLICY IF EXISTS "Users can view own liked songs" ON public.liked_songs;
DROP POLICY IF EXISTS "Users can insert own liked songs" ON public.liked_songs;
DROP POLICY IF EXISTS "Users can delete own liked songs" ON public.liked_songs;

-- Create liked_songs table policies
CREATE POLICY "Users can view own liked songs" ON public.liked_songs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liked songs" ON public.liked_songs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own liked songs" ON public.liked_songs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions for liked_songs table
GRANT SELECT, INSERT, DELETE ON public.liked_songs TO authenticated;

-- ========================================
-- PART 2: Storage Bucket Policies
-- ========================================
-- Note: These might not work via SQL - use Dashboard if they fail

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to songs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read songs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read images" ON storage.objects;

-- Create storage INSERT policies (for uploads)
CREATE POLICY "Allow authenticated uploads to songs" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'songs' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated uploads to images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Create storage SELECT policies (for reads)
CREATE POLICY "Allow public read songs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'songs');

CREATE POLICY "Allow public read images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- ========================================
-- PART 3: Verify All Policies
-- ========================================

-- Verify database policies
SELECT 
  'Database' as type,
  tablename,
  policyname, 
  cmd, 
  roles
FROM pg_policies 
WHERE tablename IN ('songs', 'liked_songs')
ORDER BY tablename, cmd;

-- Verify storage policies
SELECT 
  'Storage' as type,
  'objects' as tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- ========================================
-- IMPORTANT: If storage policies fail
-- ========================================
-- If you get errors on the storage policies section, set them up manually:
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click on 'songs' bucket > Policies tab > New Policy
--    - Operation: INSERT
--    - Roles: authenticated
--    - WITH CHECK: bucket_id = 'songs' AND auth.role() = 'authenticated'
-- 3. Repeat for 'images' bucket
-- 
-- See STORAGE_POLICIES_SETUP.md for detailed Dashboard instructions

