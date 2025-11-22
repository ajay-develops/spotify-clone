'use server';

import { createServerSupabaseClient } from '@/libs/supabaseServer';
import { executeMutation } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

interface InsertSongParams {
  userId: string;
  title: string;
  artist: string;
  songPath: string;
  imagePath: string;
}

interface InsertSongResult {
  success: boolean;
  error?: string;
  songId?: string;
}

const INSERT_SONG = gql`
  mutation InsertSong($userId: UUID, $title: String!, $artist: String!, $songPath: String!, $imagePath: String!) {
    insertIntosongsCollection(
      objects: [
        {
          user_id: $userId
          title: $title
          artist: $artist
          song_path: $songPath
          image_path: $imagePath
        }
      ]
    ) {
      records {
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
`;

const insertSong = async (params: InsertSongParams): Promise<InsertSongResult> => {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to upload songs',
      };
    }

    // Insert song using GraphQL mutation
    const data = await executeMutation(INSERT_SONG, {
      userId: params.userId,
      title: params.title,
      artist: params.artist,
      songPath: params.songPath,
      imagePath: params.imagePath,
    });

    const insertedSong = data?.insertIntosongsCollection?.records?.[0];

    if (!insertedSong) {
      return {
        success: false,
        error: 'Failed to create song record',
      };
    }

    return {
      success: true,
      songId: String(insertedSong.id),
    };
  } catch (error: any) {
    console.error('Insert song error:', error);
    return {
      success: false,
      error: error.message || 'Failed to insert song',
    };
  }
};

export default insertSong;

