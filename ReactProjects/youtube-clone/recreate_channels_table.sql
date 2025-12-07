-- Alternative: Recreate channels table from scratch (safest option)
-- This completely drops and recreates the table with the correct schema

-- Drop the existing table (WARNING: This deletes all data!)
DROP TABLE IF EXISTS public.channels CASCADE;

-- Create new channels table with correct schema
CREATE TABLE public.channels (
  channel_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_tag VARCHAR(100) NOT NULL UNIQUE,
  channel_name VARCHAR(255) NOT NULL,
  channel_description VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_channel UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_channels_user_id ON public.channels(user_id);
CREATE INDEX idx_channels_channel_tag ON public.channels(channel_tag);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to channels" 
ON public.channels FOR SELECT 
USING (true);

CREATE POLICY "Allow users to insert their own channel" 
ON public.channels FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own channel" 
ON public.channels FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own channel" 
ON public.channels FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Channels table successfully recreated with UUID support!';
END $$;
