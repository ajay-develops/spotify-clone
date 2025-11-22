import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function testGraphQLEndpoint() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', SUPABASE_KEY ? '✅ Set' : '❌ Missing');
    return;
  }

  const graphqlUrl = `${SUPABASE_URL}/graphql/v1`;
  console.log('🔍 Testing GraphQL endpoint...');
  console.log('URL:', graphqlUrl);
  console.log('');

  // Simple introspection query to test if endpoint works
  const testQuery = {
    query: `
      query {
        __schema {
          queryType {
            name
          }
        }
      }
    `,
  };

  try {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(testQuery),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error Response:', text);
      return;
    }

    const data = await response.json();
    console.log('✅ GraphQL endpoint is accessible!');
    console.log('Response:', JSON.stringify(data, null, 2));

    // Try to get the actual schema
    console.log('');
    console.log('🔍 Testing songsCollection query...');
    
    const songsQuery = {
      query: `
        query {
          songsCollection(first: 1) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      `,
    };

    const songsResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(songsQuery),
    });

    if (songsResponse.ok) {
      const songsData = await songsResponse.json();
      console.log('✅ Songs query successful!');
      console.log('Response:', JSON.stringify(songsData, null, 2));
    } else {
      const errorText = await songsResponse.text();
      console.error('❌ Songs query failed:', errorText);
    }
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    console.error('Full error:', error);
  }
}

testGraphQLEndpoint();

