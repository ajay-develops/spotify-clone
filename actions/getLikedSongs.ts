import { Song } from '@/types';
import { createServerSupabaseClient } from '@/libs/supabaseServer';
import { executeQuery, convertLikedSongsCollectionToSongs } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

const GET_LIKED_SONGS = gql`
  query GetLikedSongs($userId: UUID!) {
    likedSongsCollection(
      filter: { user_id: { eq: $userId } }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          user_id
          song_id
          created_at
          songs {
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
  }
`;

const getLikedSongs = async (): Promise<Song[]> => {
  const supabase = await createServerSupabaseClient();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData?.session?.user) {
    return [];
  }

  try {
    const data = await executeQuery(GET_LIKED_SONGS, {
      userId: sessionData.session.user.id,
    });
    return convertLikedSongsCollectionToSongs(data);
  } catch (error: any) {
    console.error('Error fetching liked songs:', error.message);
    return [];
  }
};

export default getLikedSongs;
