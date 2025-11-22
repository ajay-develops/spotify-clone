import { useSupabase } from '@/providers/SupabaseProvider';
import { Song } from '@/types';

const useLoadSong = (song: Song) => {
  const { supabase } = useSupabase();

  if (!song) {
    return null;
  }

  const { data: songData } = supabase.storage
    .from('songs')
    .getPublicUrl(song.song_path);

  return songData.publicUrl;
};

export default useLoadSong;
