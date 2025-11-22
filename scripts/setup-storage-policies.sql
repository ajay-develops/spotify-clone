-- Storage Bucket Policies for songs and images buckets
-- These policies allow authenticated users to upload files

-- Enable storage bucket policies if not already enabled
-- Note: Storage policies are managed via the Supabase Dashboard or Storage API
-- This is a reference document showing the required policies

-- For the 'songs' bucket:
-- Policy: "Allow authenticated users to upload songs"
-- Type: INSERT
-- Target roles: authenticated
-- USING expression: (bucket_id = 'songs')
-- WITH CHECK expression: (bucket_id = 'songs' AND auth.role() = 'authenticated')

-- For the 'songs' bucket:
-- Policy: "Allow authenticated users to delete own songs"
-- Type: DELETE
-- Target roles: authenticated
-- USING expression: (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1])

-- For the 'songs' bucket:
-- Policy: "Allow public read access to songs"
-- Type: SELECT
-- Target roles: anon, authenticated
-- USING expression: (bucket_id = 'songs')

-- For the 'images' bucket:
-- Policy: "Allow authenticated users to upload images"
-- Type: INSERT
-- Target roles: authenticated
-- USING expression: (bucket_id = 'images')
-- WITH CHECK expression: (bucket_id = 'images' AND auth.role() = 'authenticated')

-- For the 'images' bucket:
-- Policy: "Allow authenticated users to delete own images"
-- Type: DELETE
-- Target roles: authenticated
-- USING expression: (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1])

-- For the 'images' bucket:
-- Policy: "Allow public read access to images"
-- Type: SELECT
-- Target roles: anon, authenticated
-- USING expression: (bucket_id = 'images')

-- To set up these policies, go to:
-- Supabase Dashboard > Storage > Policies > [bucket name]
-- Or use the Supabase Storage API

-- Quick setup via SQL (requires proper permissions):
-- Note: Storage policies might need to be created via Dashboard or Storage API

-- Check if storage policies exist
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
WHERE tablename LIKE 'storage.objects';

-- The buckets should already be created with public access
-- Make sure the buckets have the following settings:
-- - Public: true (for read access)
-- - File size limits: configured appropriately (e.g., 50MB for songs, 5MB for images)
-- - Allowed MIME types: configured appropriately

