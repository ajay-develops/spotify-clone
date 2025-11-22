import { config } from 'dotenv';
import { resolve } from 'path';
import { Client, cacheExchange, fetchExchange } from '@urql/core';
import gql from 'graphql-tag';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const GET_SONGS = gql`
  query GetSongs {
    songsCollection(orderBy: [{ created_at: DescNullsLast }]) {
      edges {
        node {
          id
          user_id
          title
          artist
          song_path
          image_path
          created_at
        }
      }
    }
  }
`;

async function testUrqlQuery() {
  if (!SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_KEY');
    return;
  }

  // Build GraphQL endpoint
  const graphqlUrl = SUPABASE_PROJECT_ID
    ? `https://${SUPABASE_PROJECT_ID}.supabase.co/graphql/v1`
    : SUPABASE_URL
    ? `${SUPABASE_URL}/graphql/v1`
    : null;

  if (!graphqlUrl) {
    console.error('❌ Missing SUPABASE_PROJECT_ID or SUPABASE_URL');
    return;
  }

  console.log('🔍 Testing urql client with GraphQL query...');
  console.log('Endpoint:', graphqlUrl);
  console.log('');

  // Create custom fetch function (same as server-side)
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    let method = init?.method || 'GET';
    let body = init?.body;

    // Parse URL to extract query parameters if it's a GET request
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }

    // If it's a GET request with query parameters, convert to POST
    if (method === 'GET' && url.includes('?')) {
      const urlObj = new URL(url);
      const queryParams = urlObj.searchParams;
      
      // Extract GraphQL query parameters
      const query = queryParams.get('query');
      const operationName = queryParams.get('operationName');
      const variables = queryParams.get('variables');
      
      // Convert to POST with JSON body
      method = 'POST';
      body = JSON.stringify({
        query: query || '',
        operationName: operationName || undefined,
        variables: variables ? JSON.parse(variables) : {},
      });
      
      // Remove query parameters from URL
      url = urlObj.origin + urlObj.pathname;
    }

    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('apikey', SUPABASE_KEY);
    headers.set('Authorization', `Bearer ${SUPABASE_KEY}`);

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  // Create urql client (same as server-side)
  const client = new Client({
    url: graphqlUrl,
    exchanges: [cacheExchange, fetchExchange],
    fetch: customFetch,
  });

  try {
    const result = await client.query(GET_SONGS).toPromise();

    console.log('Query result:', {
      hasData: !!result.data,
      hasError: !!result.error,
      dataKeys: result.data ? Object.keys(result.data) : [],
    });

    if (result.error) {
      console.error('❌ GraphQL query error:');
      console.error(JSON.stringify(result.error, null, 2));
      return;
    }

    if (!result.data) {
      console.error('❌ No data returned');
      return;
    }

    const songs = result.data.songsCollection?.edges || [];
    console.log(`✅ Success! Found ${songs.length} songs`);
    console.log('');
    console.log('First song:', songs[0]?.node);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUrqlQuery();

