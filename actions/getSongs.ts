import { Song } from '@/types';
import { executeQuery, convertSongsCollectionToSongs } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

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

const getSongs = async (): Promise<Song[]> => {
  try {
    const data = await executeQuery(GET_SONGS);
    return convertSongsCollectionToSongs(data);
  } catch (error: any) {
    console.error('Error fetching songs:', error.message);
    return [];
  }
};

export default getSongs;
