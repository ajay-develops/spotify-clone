import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Get song ID from command line argument or use default
const songId = process.argv[2] ? parseInt(process.argv[2], 10) : 1;

async function testGetSongById() {
  if (!SUPABASE_KEY) {
    console.error('❌ Missing environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', SUPABASE_KEY ? '✅ Set' : '❌ Missing');
    return;
  }

  // Build GraphQL endpoint from project ID or URL
  let graphqlUrl: string;
  if (SUPABASE_PROJECT_ID) {
    graphqlUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/graphql/v1`;
    console.log('📦 Using Project ID:', SUPABASE_PROJECT_ID);
  } else if (SUPABASE_URL) {
    graphqlUrl = `${SUPABASE_URL}/graphql/v1`;
    console.log('📦 Using Supabase URL:', SUPABASE_URL);
  } else {
    console.error('❌ Missing environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_PROJECT_ID:', SUPABASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
    return;
  }

  console.log('🔍 Testing GraphQL GetSongById query...');
  console.log('Endpoint:', graphqlUrl);
  console.log('Song ID:', songId);
  console.log('');

  const getSongByIdQuery = {
    query: `
      query GetSongById($id: BigInt!) {
        songsCollection(filter: { id: { eq: $id } }, first: 1) {
          edges {
            node {
              id
              title
              artist
            }
          }
        }
      }
    `,
    variables: {
      id: songId,
    },
  };

  try {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(getSongByIdQuery),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error Response:', text);
      return;
    }

    const data = await response.json();

    if (data.errors) {
      console.error('❌ GraphQL Errors:');
      console.error(JSON.stringify(data.errors, null, 2));
      return;
    }

    const song = data.data?.songsCollection?.edges?.[0]?.node;

    if (song) {
      console.log('✅ Song found!');
      console.log('');
      console.log('Song Details:');
      console.log('  ID:', song.id);
      console.log('  Title:', song.title);
      console.log('  Artist:', song.artist);
      console.log('');
      console.log('Full Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️  No song found with ID:', songId);
      console.log('');
      console.log('Full Response:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    console.error('Full error:', error);
  }
}

testGetSongById();

