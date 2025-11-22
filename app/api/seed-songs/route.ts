import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

// Free royalty-free music from various sources
const FREE_SONGS = [
  {
    title: 'Acoustic Breeze',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Happy Rock',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Jazzy Frenchy',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Memories',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/gettysburg10.wav',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Ukulele',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Sunny',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Tenderness',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop&auto=format',
  },
  {
    title: 'Once Again',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop&auto=format',
  },
];

async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 },
      );
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get first user or create a default one for seeding
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;

    const results = [];

    for (const song of FREE_SONGS) {
      try {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const songFileName = `song-${song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}.mp3`;
        const imageFileName = `image-${song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}.jpg`;

        // Download files
        const [songBuffer, imageBuffer] = await Promise.all([
          downloadFile(song.songUrl),
          downloadFile(song.imageUrl),
        ]);

        // Convert ArrayBuffer to Uint8Array for Supabase
        const songBlob = new Uint8Array(songBuffer);
        const imageBlob = new Uint8Array(imageBuffer);

        // Upload to Supabase storage
        const { data: songData, error: songError } = await supabase.storage
          .from('songs')
          .upload(songFileName, songBlob, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (songError) {
          results.push({
            title: song.title,
            status: 'error',
            error: `Song upload failed: ${songError.message}`,
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
          // Clean up song if image fails
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
          results.push({
            title: song.title,
            status: 'error',
            error: `Image upload failed: ${imageError.message}`,
          });
          continue;
        }

        // Insert into database
        const { error: insertError } = await supabase.from('songs').insert({
          user_id: userId,
          title: song.title,
          artist: song.artist,
          song_path: songData.path,
          image_path: imageData.path,
        });

        if (insertError) {
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
            error: `Database insert failed: ${insertError.message}`,
          });
        } else {
          results.push({
            title: song.title,
            status: 'success',
          });
        }
      } catch (error: any) {
        results.push({
          title: song.title,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      message: `Seeding completed: ${successCount} successful, ${errorCount} errors`,
      results,
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

