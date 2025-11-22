-- Fix Storage Bucket Policies to allow authenticated users to upload files
-- This fixes the "new row violates row-level security policy" error for storage uploads

-- Note: Storage policies are managed through the Storage API or Dashboard
-- This SQL shows what needs to be configured, but you may need to use the Supabase Dashboard

-- For the 'songs' bucket, you need these policies in Supabase Dashboard:
-- 1. Storage > Policies > songs bucket
--    - Policy Name: "Allow authenticated users to upload songs"
--    - Operation: INSERT
--    - Policy Definition: 
--      - USING: (bucket_id = 'songs' AND auth.role() = 'authenticated')
--      - WITH CHECK: (bucket_id = 'songs' AND auth.role() = 'authenticated')
--
--    - Policy Name: "Allow authenticated users to delete own songs" (optional)
--    - Operation: DELETE
--    - Policy Definition:
--      - USING: (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1])
--
--    - Policy Name: "Allow public read access to songs"
--    - Operation: SELECT
--    - Policy Definition:
--      - USING: (bucket_id = 'songs')

-- For the 'images' bucket, you need the same policies:
-- 1. Storage > Policies > images bucket
--    - Policy Name: "Allow authenticated users to upload images"
--    - Operation: INSERT
--    - Policy Definition:
--      - USING: (bucket_id = 'images' AND auth.role() = 'authenticated')
--      - WITH CHECK: (bucket_id = 'images' AND auth.role() = 'authenticated')
--
--    - Policy Name: "Allow authenticated users to delete own images" (optional)
--    - Operation: DELETE
--    - Policy Definition:
--      - USING: (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1])
--
--    - Policy Name: "Allow public read access to images"
--    - Operation: SELECT
--    - Policy Definition:
--      - USING: (bucket_id = 'images')

-- Alternative: You can also check if storage.objects policies exist:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- To set up storage policies via SQL (if supported):
-- Note: Storage policies might need to be set via Dashboard or Storage API
-- Uncomment and modify if your Supabase setup supports it:

/*
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

-- Allow public read access to songs bucket
CREATE POLICY "Allow public read songs" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'songs');

-- Allow public read access to images bucket
CREATE POLICY "Allow public read images" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');
*/

