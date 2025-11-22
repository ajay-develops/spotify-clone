import { useState, useEffect, useMemo } from 'react';

import { Song } from '@/types';
import { useSupabase } from '@/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';

const useGetSongById = (id?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [song, setSong] = useState<Song | undefined>(undefined);
  const { supabase } = useSupabase();

  useEffect(() => {
    if (!id) {
      return;
    }

    setIsLoading(true);

    const fetchSong = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', parseInt(id, 10))
        .single();

      if (error) {
        setIsLoading(false);
        return toast.error(error.message);
      }

      // Convert database row to Song type (id is number in DB, string in Song type)
      if (data) {
        setSong({
          ...data,
          id: String(data.id),
        } as Song);
      }
      setIsLoading(false);
    };

    fetchSong();
  }, [id, supabase]);

  return useMemo(
    () => ({
      isLoading,
      song,
    }),
    [isLoading, song],
  );
};

export default useGetSongById;
