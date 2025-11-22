-- Create liked_songs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.liked_songs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id BIGINT REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, song_id)
);

-- Enable Row Level Security
ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own liked songs
CREATE POLICY "Users can view own liked songs" ON public.liked_songs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own liked songs
CREATE POLICY "Users can insert own liked songs" ON public.liked_songs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own liked songs
CREATE POLICY "Users can delete own liked songs" ON public.liked_songs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS liked_songs_user_id_idx ON public.liked_songs(user_id);
CREATE INDEX IF NOT EXISTS liked_songs_song_id_idx ON public.liked_songs(song_id);
CREATE INDEX IF NOT EXISTS liked_songs_created_at_idx ON public.liked_songs(created_at DESC);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.liked_songs TO authenticated;

