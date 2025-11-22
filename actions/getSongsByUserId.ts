import { Song } from '@/types';
import { createServerSupabaseClient } from '@/libs/supabaseServer';
import { executeQuery, convertSongsCollectionToSongs } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

const GET_SONGS_BY_USER_ID = gql`
  query GetSongsByUserId($userId: UUID!) {
    songsCollection(
      filter: { user_id: { eq: $userId } }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
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

const getSongsByUserId = async (): Promise<Song[]> => {
  const supabase = await createServerSupabaseClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return [];
  }

  try {
    const data = await executeQuery(GET_SONGS_BY_USER_ID, {
      userId: userData.user.id,
    });
    return convertSongsCollectionToSongs(data);
  } catch (error: any) {
    console.error('Error fetching songs by user ID:', error.message);
    return [];
  }
};

export default getSongsByUserId;
