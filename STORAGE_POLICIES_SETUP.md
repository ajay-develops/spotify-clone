# CRITICAL: Fix Storage Upload Error

## The Problem
Error: `new row violates row-level security policy` when uploading songs/images.

**This is NOT a database table issue** - it's a **Storage Bucket RLS policy issue**.

## Solution: Set Up Storage Bucket Policies

### Step 1: Go to Supabase Dashboard
1. Visit https://app.supabase.com
2. Select your project
3. Click **Storage** in the left sidebar

### Step 2: Configure 'songs' Bucket Policies

1. Click on the **`songs`** bucket name
2. Click on the **"Policies"** tab
3. Click **"New Policy"** button

#### Policy 1: Allow Authenticated Users to Upload Songs
- **Policy Name**: `Allow authenticated uploads to songs`
- **Allowed Operation**: Select **"INSERT"**
- **Target Roles**: Select **"authenticated"**
- **Policy Definition** (USING expression):
  ```sql
  bucket_id = 'songs' AND auth.role() = 'authenticated'
  ```
- **Policy Definition** (WITH CHECK expression):
  ```sql
  bucket_id = 'songs' AND auth.role() = 'authenticated'
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 2: Allow Public Read Access to Songs
- **Policy Name**: `Allow public read songs`
- **Allowed Operation**: Select **"SELECT"**
- **Target Roles**: Select **"anon"** and **"authenticated"**
- **Policy Definition** (USING expression):
  ```sql
  bucket_id = 'songs'
  ```
- Click **"Review"** then **"Save policy"**

### Step 3: Configure 'images' Bucket Policies

1. Click on the **`images`** bucket name
2. Click on the **"Policies"** tab
3. Click **"New Policy"** button

#### Policy 1: Allow Authenticated Users to Upload Images
- **Policy Name**: `Allow authenticated uploads to images`
- **Allowed Operation**: Select **"INSERT"**
- **Target Roles**: Select **"authenticated"**
- **Policy Definition** (USING expression):
  ```sql
  bucket_id = 'images' AND auth.role() = 'authenticated'
  ```
- **Policy Definition** (WITH CHECK expression):
  ```sql
  bucket_id = 'images' AND auth.role() = 'authenticated'
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 2: Allow Public Read Access to Images
- **Policy Name**: `Allow public read images`
- **Allowed Operation**: Select **"SELECT"**
- **Target Roles**: Select **"anon"** and **"authenticated"**
- **Policy Definition** (USING expression):
  ```sql
  bucket_id = 'images'
  ```
- Click **"Review"** then **"Save policy"**

## Quick Alternative: Use SQL (if your Supabase supports it)

Try running this SQL in Supabase SQL Editor:

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

**Note**: Storage policies are usually managed through the Dashboard UI. The SQL method may not work in all Supabase setups.

## Verify Policies Are Working

After setting up the policies:

1. Make sure you're logged in (authenticated user)
2. Try uploading a song in your app
3. Check the browser console - the storage error should be gone

## Common Issues

- **Policy not showing up**: Make sure you saved it and refresh the page
- **Still getting errors**: Check that you're logged in as an authenticated user
- **Bucket not found**: Make sure the buckets `songs` and `images` exist in your Storage

## Summary

The database table policies are correct. The issue is that **Storage buckets need their own RLS policies** to allow authenticated users to upload files. Set up the policies via Dashboard (recommended) or SQL (if supported).

