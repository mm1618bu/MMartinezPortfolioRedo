-- Create replies table for comment replies
CREATE TABLE comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on comment_id for faster queries
CREATE INDEX idx_replies_comment_id ON comment_replies(comment_id);

-- Create index on created_at for sorting
CREATE INDEX idx_replies_created_at ON comment_replies(created_at ASC);

-- Enable Row Level Security
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to replies" ON comment_replies
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to replies" ON comment_replies
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to replies" ON comment_replies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to replies" ON comment_replies
  FOR DELETE
  USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_replies_updated_at
    BEFORE UPDATE ON comment_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add reply_count column to comments table to track number of replies
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Function to update reply count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reply count
CREATE TRIGGER update_comment_reply_count_trigger
    AFTER INSERT OR DELETE ON comment_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reply_count();
