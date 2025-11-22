import { Client, cacheExchange, fetchExchange } from '@urql/core';
import { createServerSupabaseClient } from './supabaseServer';

// Get GraphQL endpoint from Supabase Project ID
const getGraphQLEndpoint = () => {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  if (projectId) {
    return `https://${projectId}.supabase.co/graphql/v1`;
  }
  // Fallback to URL-based construction for backward compatibility
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/graphql/v1`;
  }
  throw new Error('Either NEXT_PUBLIC_SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL must be set');
};

// Get API key
const getApiKey = () => {
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set');
  }
  return apiKey;
};

/**
 * Custom fetch function for urql that properly handles GraphQL requests
 * Supabase GraphQL requires POST requests, so we convert GET to POST
 */
const createCustomFetch = (apiKey: string, authToken: string) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
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
    headers.set('apikey', apiKey);
    headers.set('Authorization', `Bearer ${authToken}`);

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
};

/**
 * Create server-side urql client for Server Components and Server Actions
 * Includes authentication token from Supabase session
 */
export const createServerUrqlClient = async (): Promise<Client> => {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const apiKey = getApiKey();
  const authToken = session?.access_token || apiKey; // Fallback to API key if no session

  return new Client({
    url: getGraphQLEndpoint(),
    exchanges: [cacheExchange, fetchExchange],
    fetch: createCustomFetch(apiKey, authToken),
  });
};

