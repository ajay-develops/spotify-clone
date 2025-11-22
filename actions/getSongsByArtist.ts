import { Song } from '@/types';
import { executeQuery, convertSongsCollectionToSongs } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

const GET_SONGS_BY_ARTIST = gql`
  query GetSongsByArtist($artist: String!) {
    songsCollection(
      filter: { artist: { ilike: $artist } }
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

const getSongsByArtist = async (artist: string): Promise<Song[]> => {
  // Return empty array if no search query
  if (!artist || artist.trim() === '') {
    return [];
  }

  try {
    const data = await executeQuery(GET_SONGS_BY_ARTIST, {
      artist: `%${artist.trim()}%`,
    });
    return convertSongsCollectionToSongs(data);
  } catch (error: any) {
    console.error('Error searching songs by artist:', error.message);
    return [];
  }
};

export default getSongsByArtist;
