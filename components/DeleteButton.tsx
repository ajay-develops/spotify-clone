'use client';

import { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MdDelete } from 'react-icons/md';
import { toast } from 'react-hot-toast';

import { useUser } from '@/hooks/useUser';
import useAuthModal from '@/hooks/useAuthModal';
import deleteSong from '@/actions/deleteSong';

interface DeleteButtonProps {
  songId: string;
  iconSize?: number;
  showText?: boolean;
}

const DeleteButton = ({ songId, iconSize = 25, showText = false }: DeleteButtonProps) => {
  const router = useRouter();
  const { user } = useUser();
  const { onOpen } = useAuthModal();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      return onOpen();
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteSong(songId);

      if (result.success) {
        toast.success('Song deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete song');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete song');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      className={`
        hover:opacity-75 transition
        ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
        ${showText ? 'flex items-center gap-x-2 px-3 py-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400' : ''}
      `}
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete song"
    >
      <MdDelete 
        color={isDeleting ? '#888' : showText ? '#ef4444' : 'white'} 
        size={iconSize} 
      />
      {showText && <span className="text-sm font-medium">Delete</span>}
    </button>
  );
};

export default DeleteButton;

