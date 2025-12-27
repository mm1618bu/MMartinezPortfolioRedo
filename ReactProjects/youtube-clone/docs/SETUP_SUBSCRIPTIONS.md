# How to Set Up Subscriptions in Your Database

## Quick Setup (3 steps)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/ruwkbhmdfbuapnqeajci/sql

### Step 2: Copy the SQL Below
Copy the entire SQL code from the section below.

### Step 3: Run in SQL Editor
1. Click "New Query" in Supabase SQL Editor
2. Paste the SQL code
3. Click "Run" (or press Ctrl/Cmd + Enter)

---

## SQL Code to Run

```sql
-- ================================================
-- SUBSCRIPTIONS TABLE
-- ================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id INTEGER NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel_id ON subscriptions(channel_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
-- Allow users to read all subscriptions (to show subscriber counts)
CREATE POLICY "Anyone can view subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

-- Allow authenticated users to subscribe
CREATE POLICY "Users can subscribe to channels"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to unsubscribe
CREATE POLICY "Users can unsubscribe from channels"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON subscriptions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE subscriptions_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE subscriptions IS 'Stores user subscriptions to channels';
```

---

## Video Reactions (Optional - for later)

If you also want to add the video reactions (like/dislike) table, run this too:

```sql
-- ================================================
-- VIDEO REACTIONS TABLE
-- ================================================

-- Create video_reactions table
CREATE TABLE IF NOT EXISTS video_reactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_video_reactions_user_id ON video_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_reactions_video_id ON video_reactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reactions_type ON video_reactions(reaction_type);

-- Enable RLS
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view video reactions"
  ON video_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON video_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON video_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON video_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON video_reactions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE video_reactions_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE video_reactions IS 'Stores user reactions (likes/dislikes) for videos';
```

---

## Verify Installation

After running the SQL, verify the tables were created by running:

```sql
-- Check subscriptions table
SELECT * FROM subscriptions LIMIT 1;

-- Check video_reactions table (if you created it)
SELECT * FROM video_reactions LIMIT 1;
```

You should see empty results (no error) which means the tables exist!

---

## What This Does

- **subscriptions table**: Stores which users are subscribed to which channels
- **Unique constraint**: Prevents duplicate subscriptions (one sub per user per channel)
- **Row Level Security**: Only lets users manage their own subscriptions
- **Cascading deletes**: If a user or channel is deleted, subscriptions are cleaned up automatically
- **Indexes**: Makes queries fast even with many subscribers

---

## Troubleshooting

**Error: relation "channels" does not exist**
- Make sure your channels table is created first
- Check the column name is `channel_id` not just `id`

**Error: permission denied**
- Make sure you're logged into Supabase dashboard
- Try running the GRANT statements again

**Error: policy already exists**
- Safe to ignore - means you already ran this migration before
- You can drop and recreate: `DROP POLICY "policy_name" ON subscriptions;`

---

## Next Steps

After creating the tables, your subscribe button on the Channel page will work automatically!

Test it by:
1. Opening a channel page
2. Clicking the Subscribe button
3. Refresh the page - the subscriber count should increase
4. Click again to unsubscribe - count should decrease
