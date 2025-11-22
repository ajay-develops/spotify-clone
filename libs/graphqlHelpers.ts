import { DocumentNode } from 'graphql';
import { createServerUrqlClient } from './urqlServerClient';
import { Song } from '@/types';

/**
 * Execute a GraphQL query on the server
 */
export const executeQuery = async <T = any>(
  query: DocumentNode | string,
  variables?: Record<string, any>,
): Promise<T> => {
  try {
    const client = await createServerUrqlClient();
    // Build endpoint URL for logging
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    const graphqlUrl = projectId
      ? `https://${projectId}.supabase.co/graphql/v1`
      : process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
      : 'unknown';
    
    console.log('GraphQL endpoint:', graphqlUrl);
    console.log('GraphQL query variables:', variables || 'none');
    
    const result = await client.query(query, variables).toPromise();

    console.log('GraphQL query result:', {
      hasData: !!result.data,
      hasError: !!result.error,
      dataKeys: result.data ? Object.keys(result.data) : [],
    });

    if (result.error) {
      console.error('GraphQL query error:', result.error);
      console.error('GraphQL error details:', JSON.stringify(result.error, null, 2));
      throw new Error(result.error.message);
    }

    if (!result.data) {
      console.warn('No data returned from GraphQL query');
      throw new Error('No data returned from GraphQL query');
    }

    return result.data as T;
  } catch (error: any) {
    console.error('GraphQL execution error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.message?.includes('Not Found') || error.message?.includes('404')) {
      throw new Error(
        'GraphQL endpoint not found. Please enable the pg_graphql extension in Supabase Dashboard → SQL Editor. Run: CREATE EXTENSION IF NOT EXISTS pg_graphql;'
      );
    }
    throw error;
  }
};

/**
 * Execute a GraphQL mutation on the server
 */
export const executeMutation = async <T = any>(
  mutation: DocumentNode | string,
  variables?: Record<string, any>,
): Promise<T> => {
  try {
    const client = await createServerUrqlClient();
    const result = await client.mutation(mutation, variables).toPromise();

    if (result.error) {
      console.error('GraphQL mutation error:', result.error);
      console.error('GraphQL error details:', JSON.stringify(result.error, null, 2));
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL mutation');
    }

    return result.data as T;
  } catch (error: any) {
    console.error('GraphQL mutation execution error:', error);
    if (error.message?.includes('Not Found') || error.message?.includes('404')) {
      throw new Error(
        'GraphQL endpoint not found. Please enable the pg_graphql extension in Supabase Dashboard → SQL Editor. Run: CREATE EXTENSION IF NOT EXISTS pg_graphql;'
      );
    }
    throw error;
  }
};

/**
 * Convert GraphQL songsCollection response to Song[] format
 */
export const convertSongsCollectionToSongs = (
  data: any,
): Song[] => {
  if (!data?.songsCollection?.edges) {
    return [];
  }

  return data.songsCollection.edges.map((edge: any) => ({
    id: String(edge.node.id), // ID is returned as string from GraphQL
    user_id: edge.node.user_id || '',
    title: edge.node.title || '',
    artist: edge.node.artist || '',
    song_path: edge.node.song_path || '',
    image_path: edge.node.image_path || '',
  }));
};

/**
 * Convert GraphQL likedSongsCollection response to Song[] format
 */
export const convertLikedSongsCollectionToSongs = (
  data: any,
): Song[] => {
  if (!data?.likedSongsCollection?.edges) {
    return [];
  }

  return data.likedSongsCollection.edges
    .map((edge: any) => edge.node.songs)
    .filter((song: any) => song !== null)
    .map((song: any) => ({
      id: String(song.id),
      user_id: song.user_id || '',
      title: song.title || '',
      artist: song.artist || '',
      song_path: song.song_path || '',
      image_path: song.image_path || '',
    }));
};

