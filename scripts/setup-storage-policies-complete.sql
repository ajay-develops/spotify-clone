-- Complete Storage Policies Setup
-- This script creates all necessary storage bucket policies for uploads

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads to songs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read songs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read images" ON storage.objects;

-- Step 2: Create INSERT policies for authenticated users
-- Allow authenticated users to upload to songs bucket
CREATE POLICY "Allow authenticated uploads to songs" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'songs' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to upload to images bucket
CREATE POLICY "Allow authenticated uploads to images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Step 3: Create SELECT policies for public read access
-- Allow public read access to songs bucket
CREATE POLICY "Allow public read songs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'songs');

-- Allow public read access to images bucket
CREATE POLICY "Allow public read images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- Step 4: Verify policies were created
SELECT 
  policyname,
  cmd,
  roles,
  with_check,
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY bucket_id, cmd;

-- Note: If the above doesn't work, you may need to set up policies via Dashboard:
-- Dashboard > Storage > [bucket name] > Policies > New Policy
-- See STORAGE_POLICIES_SETUP.md for detailed Dashboard instructions

