# Fix Storage Upload RLS Policy Issue

## Problem
Error: `new row violates row-level security policy` when uploading songs/images to Supabase Storage.

## Root Cause
The storage buckets (`songs` and `images`) don't have RLS policies that allow authenticated users to upload files.

## Solution: Set Up Storage Bucket Policies in Supabase Dashboard

### Step 1: Go to Supabase Dashboard
1. Visit https://app.supabase.com
2. Select your project
3. Go to **Storage** in the left sidebar

### Step 2: Configure 'songs' Bucket Policies

1. Click on the **'songs'** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Authenticated Users to Upload Songs
- **Policy Name**: `Allow authenticated uploads to songs`
- **Allowed Operation**: `INSERT` (for uploads)
- **Policy Definition**:
  ```sql
  (bucket_id = 'songs' AND auth.role() = 'authenticated')
  ```
- **Target Roles**: `authenticated`

#### Policy 2: Allow Public Read Access to Songs
- **Policy Name**: `Allow public read songs`
- **Allowed Operation**: `SELECT` (for reading)
- **Policy Definition**:
  ```sql
  (bucket_id = 'songs')
  ```
- **Target Roles**: `anon`, `authenticated`

#### Policy 3: (Optional) Allow Users to Delete Own Songs
- **Policy Name**: `Allow users to delete own songs`
- **Allowed Operation**: `DELETE`
- **Policy Definition**:
  ```sql
  (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1])
  ```
- **Target Roles**: `authenticated`

### Step 3: Configure 'images' Bucket Policies

1. Click on the **'images'** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Authenticated Users to Upload Images
- **Policy Name**: `Allow authenticated uploads to images`
- **Allowed Operation**: `INSERT` (for uploads)
- **Policy Definition**:
  ```sql
  (bucket_id = 'images' AND auth.role() = 'authenticated')
  ```
- **Target Roles**: `authenticated`

#### Policy 2: Allow Public Read Access to Images
- **Policy Name**: `Allow public read images`
- **Allowed Operation**: `SELECT` (for reading)
- **Policy Definition**:
  ```sql
  (bucket_id = 'images')
  ```
- **Target Roles**: `anon`, `authenticated`

#### Policy 3: (Optional) Allow Users to Delete Own Images
- **Policy Name**: `Allow users to delete own images`
- **Allowed Operation**: `DELETE`
- **Policy Definition**:
  ```sql
  (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1])
  ```
- **Target Roles**: `authenticated`

## Quick Setup via SQL (Alternative Method)

If your Supabase setup allows SQL-based storage policy creation, you can also run:

```sql
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

-- Allow public read access to songs
CREATE POLICY "Allow public read songs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'songs');

-- Allow public read access to images
CREATE POLICY "Allow public read images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');
```

**Note**: Storage policies are typically managed through the Dashboard UI. The SQL method may not work in all Supabase setups.

## Verify Policies Are Working

After setting up the policies:

1. Try uploading a song in your app
2. Check the browser console - the storage upload error should be gone
3. If you still see errors, check:
   - That you're logged in as an authenticated user
   - That the bucket names are correct (`songs` and `images`)
   - That the policies were saved correctly

## Additional Notes

- **RLS must be enabled** on storage buckets (it's enabled by default)
- Make sure buckets are set to **public** for read access, or use policies for SELECT operations
- The policies above allow **all authenticated users** to upload - adjust if you need more restrictions

