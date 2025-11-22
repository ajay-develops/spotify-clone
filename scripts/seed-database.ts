#!/usr/bin/env ts-node

/**
 * Seed database with free songs
 * 
 * Usage: 
 *   pnpm ts-node scripts/seed-database.ts
 *   or
 *   pnpm run seed
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types_db';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

// Free royalty-free music from various sources
// Using Unsplash for images and free sound samples
const FREE_SONGS = [
  {
    title: 'Acoustic Breeze',
    artist: 'Bensound',
    songUrl: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Happy Rock',
    artist: 'Bensound',
    songUrl: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Jazzy Frenchy',
    artist: 'Bensound',
    songUrl: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Memories',
    artist: 'Bensound',
    songUrl: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Ukulele',
    artist: 'Bensound',
    songUrl: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop&auto=format',
  },
];

async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

async function seedSongs() {
  console.log('🎵 Starting to seed songs...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
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
      console.log('  Please create the "songs" bucket manually in Supabase Storage.\n');
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
      console.log('  Please create the "images" bucket manually in Supabase Storage.\n');
    } else {
      console.log('  ✅ Created "images" bucket\n');
    }
  } else {
    console.log('  ✅ "images" bucket exists\n');
  }

  // Verify songs table exists
  console.log('🔍 Verifying database connection...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('songs')
    .select('id')
    .limit(1);
  
  if (tableError && tableError.message.includes('schema cache')) {
    console.log('  ⚠️  Schema cache issue. This usually resolves on retry.');
  } else if (tableError) {
    console.error(`  ❌ Error accessing songs table: ${tableError.message}`);
    console.log('\n  Please ensure the "songs" table exists in your Supabase database.');
    console.log('  The table should have columns: id, title, artist, song_path, image_path, user_id, created_at\n');
    throw new Error(`Database error: ${tableError.message}`);
  } else {
    console.log('  ✅ Database connection verified\n');
  }

  // Get first user or use null
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users && users.length > 0 ? users[0].id : null;

  if (!userId) {
    console.log('⚠️  Warning: No users found. Songs will be created without user_id.\n');
  }

  const results = [];

  for (const song of FREE_SONGS) {
    try {
      console.log(`📥 Processing: "${song.title}" by ${song.artist}`);

      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const songFileName = `song-${song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}.mp3`;
      const imageFileName = `image-${song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}.jpg`;

      // Download files
      console.log(`  Downloading audio and image...`);
      const [songBuffer, imageBuffer] = await Promise.all([
        downloadFile(song.songUrl),
        downloadFile(song.imageUrl),
      ]);

      // Convert to Uint8Array for Supabase
      const songBlob = new Uint8Array(songBuffer);
      const imageBlob = new Uint8Array(imageBuffer);

      // Upload to Supabase storage
      console.log(`  Uploading to Supabase storage...`);
      
      const { data: songData, error: songError } = await supabase.storage
        .from('songs')
        .upload(songFileName, songBlob, {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (songError) {
        console.error(`  ❌ Song upload failed: ${songError.message}`);
        results.push({
          title: song.title,
          status: 'error',
          error: `Song upload: ${songError.message}`,
        });
        continue;
      }

      const { data: imageData, error: imageError } = await supabase.storage
        .from('images')
        .upload(imageFileName, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (imageError) {
        console.error(`  ❌ Image upload failed: ${imageError.message}`);
        // Clean up song if image fails
        if (songData?.path) {
          await supabase.storage.from('songs').remove([songData.path]);
        }
        results.push({
          title: song.title,
          status: 'error',
          error: `Image upload: ${imageError.message}`,
        });
        continue;
      }

      // Insert into database using REST API to bypass schema cache
      const insertPayload = {
        user_id: userId,
        title: song.title,
        artist: song.artist,
        song_path: songData.path,
        image_path: imageData.path,
      };

      // Use REST API directly
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
        console.error(`  ❌ Database insert failed: ${errorText}`);
        // Clean up uploaded files
        if (songData?.path) {
          await supabase.storage.from('songs').remove([songData.path]);
        }
        if (imageData?.path) {
          await supabase.storage.from('images').remove([imageData.path]);
        }
        results.push({
          title: song.title,
          status: 'error',
          error: `Database insert: ${errorText}`,
        });
      } else {
        console.log(`  ✅ Successfully added: "${song.title}"\n`);
        results.push({
          title: song.title,
          status: 'success',
        });
      }
    } catch (error: any) {
      console.error(`  ❌ Error processing "${song.title}": ${error.message}\n`);
      results.push({
        title: song.title,
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
}

// Run the seeding script
if (require.main === module) {
  seedSongs()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedSongs;

