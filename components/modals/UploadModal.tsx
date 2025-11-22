'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import uniqid from 'uniqid';

import { useSupabase } from '@/providers/SupabaseProvider';
import { useUser } from '@/hooks/useUser';
import useUploadModal from '@/hooks/useUploadModal';
import insertSong from '@/actions/insertSong';

import Modal from './Modal';
import Input from '../Input';
import Button from '../Button';

const UploadModal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  const { isOpen, onClose } = useUploadModal();
  const { user } = useUser();

  const { register, handleSubmit, reset } = useForm<FieldValues>({
    defaultValues: {
      artist: '',
      title: '',
      song: null,
      image: null,
    },
  });

  const onChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  // Normalize text input - trim, remove excessive whitespace, handle special characters
  const normalizeText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 255); // Limit length for database
  };

  // Sanitize filename for storage - very safe for all filesystems
  const sanitizeFilename = (text: string): string => {
    if (!text || typeof text !== 'string') return 'untitled';
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) // Limit length for filenames
      || 'untitled'; // Fallback if empty
  };

  // Validate and normalize file extension
  const getFileExtension = (filename: string, allowedExtensions: string[], defaultExt: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return allowedExtensions.includes(ext) ? ext : defaultExt;
  };

  const onSubmit: SubmitHandler<FieldValues> = async (values) => {
    try {
      setIsLoading(true);

      const imageFile = values.image?.[0];
      const songFile = values.song?.[0];

      // Validate required fields
      if (!imageFile || !songFile || !user) {
        toast.error('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Normalize title and artist inputs
      const normalizedTitle = normalizeText(values.title);
      const normalizedArtist = normalizeText(values.artist);

      // Validate normalized inputs
      if (!normalizedTitle || normalizedTitle.length === 0) {
        toast.error('Song title is required');
        setIsLoading(false);
        return;
      }

      if (!normalizedArtist || normalizedArtist.length === 0) {
        toast.error('Artist name is required');
        setIsLoading(false);
        return;
      }

      // Validate file sizes (optional - adjust limits as needed)
      const MAX_SONG_SIZE = 50 * 1024 * 1024; // 50MB
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

      if (songFile.size > MAX_SONG_SIZE) {
        toast.error('Song file is too large. Maximum size is 50MB');
        setIsLoading(false);
        return;
      }

      if (imageFile.size > MAX_IMAGE_SIZE) {
        toast.error('Image file is too large. Maximum size is 5MB');
        setIsLoading(false);
        return;
      }

      const uploadandDocumentSong = async () => {
        const uniqueID = uniqid();
        
        // Sanitize filenames for storage (safe for all filesystems)
        const sanitizedTitle = sanitizeFilename(normalizedTitle);
        
        // Validate and get file extensions
        const songExtension = getFileExtension(songFile.name, ['mp3', 'wav', 'm4a', 'ogg'], 'mp3');
        const imageExtension = getFileExtension(imageFile.name, ['jpg', 'jpeg', 'png', 'webp'], 'jpg');
        
        // Create safe filenames with unique ID (using timestamp + random for extra uniqueness)
        const timestamp = Date.now();
        const songFileName = `${sanitizedTitle}-${timestamp}-${uniqueID}.${songExtension}`;
        const imageFileName = `${sanitizedTitle}-${timestamp}-${uniqueID}.${imageExtension}`;

        // Upload Song
        const { data: songData, error: songError } =
          await supabase.storage
            .from('songs')
            .upload(songFileName, songFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: songFile.type || 'audio/mpeg',
            });

        if (songError) {
          console.error('Song upload error:', songError);
          throw new Error(`Failed song upload: ${songError.message}`);
        }

        // Upload Image once Song Upload is Successful
        const { data: imageData, error: imageError } =
          await supabase.storage
            .from('images')
            .upload(imageFileName, imageFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageFile.type || 'image/jpeg',
            });

        if (imageError) {
          console.error('Image upload error:', imageError);
          // Clean up song if image fails
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
          throw new Error(`Failed image upload: ${imageError.message}`);
        }

        // Create record in table using GraphQL mutation
        const insertResult = await insertSong({
          userId: user.id,
          title: normalizedTitle,
          artist: normalizedArtist,
          songPath: songData.path,
          imagePath: imageData.path,
        });

        if (!insertResult.success) {
          console.error('Database insert error:', insertResult.error);
          // Clean up uploaded files if database insert fails
          if (songData?.path) {
            await supabase.storage.from('songs').remove([songData.path]);
          }
          if (imageData?.path) {
            await supabase.storage.from('images').remove([imageData.path]);
          }
          throw new Error(insertResult.error || 'Failed to save song');
        }

        // Success - reset form and refresh
        reset();
        router.refresh();
      };

      // Start upload process with toast promise
      await toast.promise(uploadandDocumentSong(), {
        loading: 'Uploading...',
        success: <b>Song Created!</b>,
        error: <b>Upload Failed</b>,
      });
      
      // Only close modal on successful upload
      onClose();
    } catch (error: any) {
      // Handle any unexpected errors
      console.error('Upload error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title='Add a Song'
      description='Upload a song file'
      isOpen={isOpen}
      onChange={onChange}
    >
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-y-4'>
        <Input
          id='title'
          disabled={isLoading}
          {...register('title', { 
            required: 'Song title is required',
            minLength: {
              value: 1,
              message: 'Song title must be at least 1 character'
            },
            maxLength: {
              value: 255,
              message: 'Song title must be less than 255 characters'
            }
          })}
          placeholder='Song Title'
        />
        <Input
          id='artist'
          disabled={isLoading}
          {...register('artist', { 
            required: 'Artist name is required',
            minLength: {
              value: 1,
              message: 'Artist name must be at least 1 character'
            },
            maxLength: {
              value: 255,
              message: 'Artist name must be less than 255 characters'
            }
          })}
          placeholder='Artist'
        />
        <div>
          <p className='pb-4 leading-4'>Select a song file</p>
          <Input
            id='song'
            type='file'
            disabled={isLoading}
            accept='.mp3'
            {...register('song', { required: true })}
          />
        </div>
        <div>
          <p className='pb-4 leading-4'>Select an image</p>
          <Input
            id='image'
            type='file'
            disabled={isLoading}
            accept='image/*'
            {...register('image', { required: true })}
          />
        </div>
        <Button type='submit' disabled={isLoading} className='text-white'>
          Create
        </Button>
      </form>
    </Modal>
  );
};

export default UploadModal;
