import { Song } from '@/types';

import { useUser } from './useUser';
import usePlayer from './usePlayer';
import useAuthModal from './useAuthModal';

const useOnPlay = (songs: Song[]) => {
  const { setId, setIds, setUnshuffledIds } = usePlayer();
  const authModal = useAuthModal();
  const { user } = useUser();

  const onPlay = (id: string) => {
    if (!user) {
      return authModal.onOpen();
    }

    setId(id);
    const ids = songs.map((song) => song.id);
    setIds(ids);
    setUnshuffledIds(ids);
  };

  return onPlay;
};

export default useOnPlay;
