import getSongsByTitle from '@/actions/getSongsByTitle';
import getSongsByArtist from '@/actions/getSongsByArtist';
import { Song } from '@/types';

import Header from '@/components/Header';
import SearchInput from '@/components/SearchInput';
import SearchContent from './components/SearchContent';

export const revalidate = 0;

interface SearchProps {
  searchParams: Promise<{
    query?: string;
  }>;
}

const Search = async ({ searchParams }: SearchProps) => {
  const params = await searchParams;
  const query = (params?.query || '').trim();

  let songs: Song[] = [];

  // Only search if there's a query
  if (query) {
    // Get songs matching title or artist in parallel
    const [songsByTitle, songsByArtist] = await Promise.all([
      getSongsByTitle(query),
      getSongsByArtist(query),
    ]);

    // Combine and remove duplicates (by id)
    const songsMap = new Map<string, Song>();
    
    songsByTitle.forEach((song) => {
      songsMap.set(song.id, song);
    });
    
    songsByArtist.forEach((song) => {
      songsMap.set(song.id, song);
    });

    songs = Array.from(songsMap.values());
  }

  return (
    <div
      className='bg-neutral-900 rounded-lg h-full md:mr-2 overflow-hidden 
      overflow-y-auto'
    >
      <Header className='from-bg-neutral-900'>
        <div className='mb-2 flex flex-col gap-y-6'>
          <h1 className='text-white text-3xl font-semibold'>Search</h1>
          <SearchInput />
        </div>
      </Header>
      <SearchContent songs={songs} />
    </div>
  );
};

export default Search;
