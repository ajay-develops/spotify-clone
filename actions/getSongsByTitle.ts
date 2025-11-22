import { Song } from '@/types';
import { executeQuery, convertSongsCollectionToSongs } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

const GET_SONGS_BY_TITLE = gql`
  query GetSongsByTitle($title: String!) {
    songsCollection(
      filter: { title: { ilike: $title } }
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

const getSongsByTitle = async (title: string): Promise<Song[]> => {
  // Return empty array if no search query
  if (!title || title.trim() === '') {
    return [];
  }

  try {
    const data = await executeQuery(GET_SONGS_BY_TITLE, {
      title: `%${title.trim()}%`,
    });
    return convertSongsCollectionToSongs(data);
  } catch (error: any) {
    console.error('Error searching songs by title:', error.message);
    return [];
  }
};

export default getSongsByTitle;
