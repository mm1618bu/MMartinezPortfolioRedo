-- Update channels table to work with Supabase Auth UUID user IDs
-- This assumes you want to keep using Supabase Auth

-- IMPORTANT: This will DELETE all existing channel data!
-- If you have important data, back it up first!

-- Option 1: Clear existing data (if it's test data or not needed)
TRUNCATE TABLE public.channels CASCADE;

-- Drop the existing foreign key constraint
ALTER TABLE public.channels 
DROP CONSTRAINT IF EXISTS channels_user_id_fkey;

-- Change user_id column from integer to UUID
-- Since we cleared the data, we can safely change the type
ALTER TABLE public.channels 
ALTER COLUMN user_id TYPE uuid USING NULL;

-- Make user_id NOT NULL after changing type
ALTER TABLE public.channels 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to Supabase Auth users table
ALTER TABLE public.channels 
ADD CONSTRAINT channels_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint to ensure one channel per user
ALTER TABLE public.channels 
ADD CONSTRAINT unique_user_channel UNIQUE(user_id);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON public.channels(user_id);

-- Create index on channel_tag for better query performance
CREATE INDEX IF NOT EXISTS idx_channels_channel_tag ON public.channels(channel_tag);

-- Make channel_tag unique
ALTER TABLE public.channels 
ADD CONSTRAINT unique_channel_tag UNIQUE(channel_tag);

-- Make channel_name and channel_tag NOT NULL since they're required
ALTER TABLE public.channels 
ALTER COLUMN channel_name SET NOT NULL;

ALTER TABLE public.channels 
ALTER COLUMN channel_tag SET NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to channels" ON public.channels;
DROP POLICY IF EXISTS "Allow users to insert their own channel" ON public.channels;
DROP POLICY IF EXISTS "Allow users to update their own channel" ON public.channels;
DROP POLICY IF EXISTS "Allow users to delete their own channel" ON public.channels;

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

-- Optional: Add updated_at column and trigger if you want timestamps
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger function for updated_at (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_channels_updated_at ON public.channels;
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
