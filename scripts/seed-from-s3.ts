#!/usr/bin/env ts-node

/**
 * Seed database with songs from S3 bucket
 * 
 * Usage: 
 *   pnpm tsx scripts/seed-from-s3.ts
 *   or
 *   pnpm run seed:s3
 * 
 * Environment variables needed:
 *   SUPABASE_STORAGE_ENDPOINT=https://wtxhcjloistkmsusfzcg.storage.supabase.co/storage/v1/s3
 *   SUPABASE_STORAGE_ACCESS_KEY_ID=056ea4b279acddc06b89965db68d27a8
 *   SUPABASE_STORAGE_SECRET_ACCESS_KEY=14055ad9b4ab4c5c2776baea8fccaf7b9b09841c6f11529ce195f23e197a3e59
 *   SUPABASE_STORAGE_REGION=ap-southeast-1
 *   S3_BUCKET_NAME=your-bucket-name
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Database } from '../types_db';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;
const SUPABASE_STORAGE_ENDPOINT = process.env.SUPABASE_STORAGE_ENDPOINT!;
const SUPABASE_STORAGE_ACCESS_KEY_ID = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID!;
const SUPABASE_STORAGE_SECRET_ACCESS_KEY = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!;
const SUPABASE_STORAGE_REGION = process.env.SUPABASE_STORAGE_REGION || 'ap-southeast-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// Initialize S3 client for Supabase Storage
const s3Client = new S3Client({
  endpoint: SUPABASE_STORAGE_ENDPOINT,
  region: SUPABASE_STORAGE_REGION,
  forcePathStyle: true, // Required for S3-compatible APIs
  credentials: {
    accessKeyId: SUPABASE_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: SUPABASE_STORAGE_SECRET_ACCESS_KEY,
  },
});

async function listS3Objects(bucketName: string, prefix?: string) {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return response.Contents || [];
}

async function downloadFromS3(bucketName: string, key: string): Promise<ArrayBuffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`No body in S3 response for ${key}`);
  }

  const arrayBuffer = await response.Body.transformToByteArray();
  return arrayBuffer.buffer;
}

async function seedSongsFromS3() {
  console.log('🎵 Starting to seed songs from S3...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }

  if (!SUPABASE_STORAGE_ENDPOINT || !SUPABASE_STORAGE_ACCESS_KEY_ID || !SUPABASE_STORAGE_SECRET_ACCESS_KEY) {
    throw new Error('SUPABASE_STORAGE_ENDPOINT, SUPABASE_STORAGE_ACCESS_KEY_ID, and SUPABASE_STORAGE_SECRET_ACCESS_KEY environment variables are required. Please set them in .env.local');
  }

  if (!S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is required. Please set it in .env.local');
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check/create storage buckets
  console.log('📦 Checking storage buckets...');
  const { data: buckets } = await supabase.storage.listBuckets();
  
  const bucketNames = buckets?.map(b => b.name) || [];
  
  if (!bucketNames.includes('songs')) {
    console.log('  Creating "songs" bucket...');
    const { error: songsError } = await supabase.storage.createBucket('songs', {
      public: true,
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave'],
    });
    if (songsError) {
      console.error(`  ❌ Failed to create songs bucket: ${songsError.message}`);
    } else {
      console.log('  ✅ Created "songs" bucket\n');
    }
  } else {
    console.log('  ✅ "songs" bucket exists\n');
  }

  if (!bucketNames.includes('images')) {
    console.log('  Creating "images" bucket...');
    const { error: imagesError } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    });
    if (imagesError) {
      console.error(`  ❌ Failed to create images bucket: ${imagesError.message}`);
    } else {
      console.log('  ✅ Created "images" bucket\n');
    }
  } else {
    console.log('  ✅ "images" bucket exists\n');
  }

  // Get first user or use null
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users && users.length > 0 ? users[0].id : null;

  if (!userId) {
    console.log('⚠️  Warning: No users found. Songs will be created without user_id.\n');
  }

  // List objects in S3 bucket
  console.log(`📂 Listing objects in S3 bucket: ${S3_BUCKET_NAME}...\n`);
  
  try {
    // List songs and images separately
    const [songObjects, imageObjects] = await Promise.all([
      listS3Objects(S3_BUCKET_NAME, 'songs/'),
      listS3Objects(S3_BUCKET_NAME, 'images/'),
    ]);

    console.log(`  Found ${songObjects.length} audio files and ${imageObjects.length} image files\n`);

    if (songObjects.length === 0) {
      console.log('⚠️  No songs found in S3 bucket. Please ensure songs are in the "songs/" prefix.');
      return;
    }

    // Create a map of images by filename (without extension)
    const imageMap = new Map<string, string>();
    imageObjects.forEach(obj => {
      if (obj.Key) {
        const fileName = obj.Key.replace(/^images\//, '').replace(/\.[^/.]+$/, '');
        imageMap.set(fileName, obj.Key);
      }
    });

    const results = [];
    let processedCount = 0;

    for (const songObj of songObjects) {
      if (!songObj.Key) continue;

      try {
        processedCount++;
        console.log(`📥 Processing [${processedCount}/${songObjects.length}]: ${songObj.Key}`);

        // Extract song name (without path and extension)
        const songFileName = songObj.Key.split('/').pop() || '';
        const songNameBase = songFileName.replace(/\.[^/.]+$/, '');

        // Find matching image
        const matchingImageKey = imageMap.get(songNameBase);
        
        if (!matchingImageKey) {
          console.log(`  ⚠️  No matching image found for ${songNameBase}, skipping...\n`);
          continue;
        }

        // Download from S3
        console.log(`  Downloading from S3...`);
        const [songBuffer, imageBuffer] = await Promise.all([
          downloadFromS3(S3_BUCKET_NAME, songObj.Key),
          downloadFromS3(S3_BUCKET_NAME, matchingImageKey),
        ]);

        // Convert to Uint8Array for Supabase
        const songBlob = new Uint8Array(songBuffer);
        const imageBlob = new Uint8Array(imageBuffer);

        // Extract metadata from filename or use defaults
        const title = songNameBase.replace(/[-_]/g, ' ') || 'Untitled Song';
        const artist = 'Bensound'; // Default artist

        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const supabaseSongFileName = `song-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}.mp3`;
        const supabaseImageFileName = `image-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}.jpg`;

        // Upload to Supabase storage
        console.log(`  Uploading to Supabase storage...`);
        
        const { data: songData, error: songError } = await supabase.storage
          .from('songs')
          .upload(supabaseSongFileName, songBlob, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (songError) {
          console.error(`  ❌ Song upload failed: ${songError.message}\n`);
          results.push({
            title,
            status: 'error',
            error: `Song upload: ${songError.message}`,
          });
          continue;
        }

        const { data: imageData, error: imageError } = await supabase.storage
          .from('images')
          .upload(supabaseImageFileName, imageBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (imageError) {
          console.error(`  ❌ Image upload failed: ${imageError.message}\n`);
          // Clean up song if image fails
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
          results.push({
            title,
            status: 'error',
            error: `Image upload: ${imageError.message}`,
          });
          continue;
        }

        // Insert into database using REST API to bypass schema cache
        const insertPayload = {
          user_id: userId,
          title,
          artist,
          song_path: songData.path,
          image_path: imageData.path,
        };

        const insertResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/songs`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(insertPayload),
          }
        );

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error(`  ❌ Database insert failed: ${errorText}\n`);
          // Clean up uploaded files
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
          if (imageData?.path) {
            await supabase.storage.from('images').remove([imageData.path]);
          }
          results.push({
            title,
            status: 'error',
            error: `Database insert: ${errorText}`,
          });
        } else {
          console.log(`  ✅ Successfully added: "${title}"\n`);
          results.push({
            title,
            status: 'success',
          });
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing "${songObj.Key}": ${error.message}\n`);
        results.push({
          title: songObj.Key,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    console.log('\n📊 Seeding Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('\n🎉 Seeding completed!');

    return results;
  } catch (error: any) {
    console.error(`\n❌ Error listing S3 bucket: ${error.message}`);
    throw error;
  }
}

// Run the seeding script
if (require.main === module) {
  seedSongsFromS3()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedSongsFromS3;

