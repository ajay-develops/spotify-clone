-- Create songs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.songs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  artist TEXT,
  song_path TEXT,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, adjust as needed)
CREATE POLICY "Allow public read access to songs" ON public.songs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert songs" ON public.songs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS songs_user_id_idx ON public.songs(user_id);
CREATE INDEX IF NOT EXISTS songs_created_at_idx ON public.songs(created_at DESC);

-- Grant necessary permissions
GRANT USAGE ON SEQUENCE songs_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;

-- Grant SELECT permission to anon (public/unauthenticated) users
-- This ensures everyone can read/view songs, even without logging in
GRANT SELECT ON public.songs TO anon;

