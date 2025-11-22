'use server';

import { createServerSupabaseClient } from '@/libs/supabaseServer';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { executeQuery, executeMutation } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

interface DeleteSongResult {
  success: boolean;
  error?: string;
}

const GET_SONG_BY_ID = gql`
  query GetSongById($id: BigInt!) {
    songsCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          id
          song_path
          image_path
          user_id
        }
      }
    }
  }
`;

const DELETE_SONG = gql`
  mutation DeleteSong($id: BigInt!) {
    deleteFromsongsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

const deleteSong = async (songId: string): Promise<DeleteSongResult> => {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to delete songs',
      };
    }

    // Get the song to find file paths using GraphQL
    const songData = await executeQuery(GET_SONG_BY_ID, {
      id: BigInt(parseInt(songId, 10)),
    });

    const song = songData?.songsCollection?.edges?.[0]?.node;

    if (!song) {
      return {
        success: false,
        error: 'Song not found',
      };
    }

    // Delete files from storage first using admin client
    const deletePromises = [];

    if (song.song_path) {
      deletePromises.push(
        supabaseAdmin.storage.from('songs').remove([song.song_path])
      );
    }

    if (song.image_path) {
      deletePromises.push(
        supabaseAdmin.storage.from('images').remove([song.image_path])
      );
    }

    // Delete storage files (don't fail if files don't exist)
    await Promise.allSettled(deletePromises);

    // Delete the song from database using GraphQL mutation
    await executeMutation(DELETE_SONG, {
      id: BigInt(parseInt(songId, 10)),
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Delete song error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete song',
    };
  }
};

export default deleteSong;

