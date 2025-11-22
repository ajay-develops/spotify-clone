import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Free royalty-free music data
const FREE_SONGS = [
  {
    title: 'Acoustic Breeze',
    artist: 'Benjamin Tissot',
    songUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop',
  },
  {
    title: 'Happy Rock',
    artist: 'Benjamin Tissot',
    songUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
  },
  {
    title: 'Jazzy Frenchy',
    artist: 'Benjamin Tissot',
    songUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop',
  },
  {
    title: 'Memories',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=500&fit=crop',
  },
  {
    title: 'Ukulele',
    artist: 'Bensound',
    songUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop',
  },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, buffer);
}

async function seedSongs() {
  console.log('Starting to seed songs...');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Create a default user for seeding (or use service role)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.log('No users found. Please create a user first or the songs will not have a user_id.');
    console.log('Continuing with null user_id...');
  }

  const userId = users && users.length > 0 ? users[0].id : null;
  const tempDir = path.join(process.cwd(), 'temp-seed');

  try {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (const song of FREE_SONGS) {
      try {
        console.log(`Processing: ${song.title} by ${song.artist}`);

        const uniqueId = uuidv4();
        const songFileName = `song-${song.title.replace(/\s+/g, '-')}-${uniqueId}.mp3`;
        const imageFileName = `image-${song.title.replace(/\s+/g, '-')}-${uniqueId}.jpg`;

        const songPath = path.join(tempDir, songFileName);
        const imagePath = path.join(tempDir, imageFileName);

        // Download files
        console.log(`  Downloading song...`);
        await downloadFile(song.songUrl, songPath);
        
        console.log(`  Downloading image...`);
        await downloadFile(song.imageUrl, imagePath);

        // Read files as buffers
        const songBuffer = fs.readFileSync(songPath);
        const imageBuffer = fs.readFileSync(imagePath);

        // Upload to Supabase storage
        console.log(`  Uploading to Supabase...`);
        
        const { data: songData, error: songError } = await supabase.storage
          .from('songs')
          .upload(songFileName, songBuffer, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (songError) {
          console.error(`  Error uploading song: ${songError.message}`);
          continue;
        }

        const { data: imageData, error: imageError } = await supabase.storage
          .from('images')
          .upload(imageFileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (imageError) {
          console.error(`  Error uploading image: ${imageError.message}`);
          // Clean up song if image fails
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
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
          console.error(`  Error inserting record: ${insertError.message}`);
          // Clean up uploaded files
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
          if (imageData?.path) {
            await supabase.storage.from('images').remove([imageData.path]);
          }
        } else {
          console.log(`  ✓ Successfully added: ${song.title}`);
        }

        // Clean up temp files
        fs.unlinkSync(songPath);
        fs.unlinkSync(imagePath);
      } catch (error: any) {
        console.error(`  Error processing ${song.title}: ${error.message}`);
      }
    }

    console.log('\n✅ Seeding completed!');
  } catch (error: any) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// Run the seeding script
seedSongs()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

