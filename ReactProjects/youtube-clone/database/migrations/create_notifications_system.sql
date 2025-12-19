-- Create notifications system
-- Migration: create_notifications_system
-- Description: Creates tables and functions for in-app notifications

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type VARCHAR(50) NOT NULL, -- 'comment', 'like', 'subscription', 'mention', 'upload', 'reply'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Who triggered the notification
  
  -- Notification state
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Action URL (where to navigate when clicked)
  action_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_notification_type CHECK (
    type IN ('comment', 'like', 'subscription', 'mention', 'upload', 'reply', 'dislike')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- In-app notification preferences
  comment_notifications BOOLEAN DEFAULT true,
  reply_notifications BOOLEAN DEFAULT true,
  like_notifications BOOLEAN DEFAULT false,
  subscription_notifications BOOLEAN DEFAULT true,
  mention_notifications BOOLEAN DEFAULT true,
  upload_notifications BOOLEAN DEFAULT true, -- From subscribed channels
  
  -- Email notification preferences (if email system implemented)
  email_enabled BOOLEAN DEFAULT true,
  email_comments BOOLEAN DEFAULT true,
  email_subscriptions BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  
  -- Push notification preferences (future)
  push_enabled BOOLEAN DEFAULT false,
  
  -- Notification frequency
  realtime_enabled BOOLEAN DEFAULT true,
  digest_frequency VARCHAR(20) DEFAULT 'none', -- 'none', 'daily', 'weekly'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
  ON notification_preferences(user_id);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function: Get user's unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = false
      AND is_archived = false
  );
END;
$$;

-- Function: Get user's notifications with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  video_id TEXT,
  comment_id UUID,
  channel_id UUID,
  actor_user_id UUID,
  is_read BOOLEAN,
  is_archived BOOLEAN,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  -- Joined data
  actor_channel_name VARCHAR,
  actor_avatar_url TEXT,
  video_title VARCHAR,
  video_thumbnail_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.video_id,
    n.comment_id,
    n.channel_id,
    n.actor_user_id,
    n.is_read,
    n.is_archived,
    n.action_url,
    n.metadata,
    n.created_at,
    n.read_at,
    -- Actor information
    c.channel_name as actor_channel_name,
    c.avatar_url as actor_avatar_url,
    -- Video information
    v.title as video_title,
    v.thumbnail_url as video_thumbnail_url
  FROM notifications n
  LEFT JOIN channels c ON n.actor_user_id = c.user_id
  LEFT JOIN videos v ON n.video_id = v.id
  WHERE n.user_id = p_user_id
    AND n.is_archived = false
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = p_user_id
    AND is_read = false;
  
  RETURN FOUND;
END;
$$;

-- Function: Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW()
  WHERE user_id = p_user_id
    AND is_read = false
    AND is_archived = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function: Delete notification
CREATE OR REPLACE FUNCTION delete_notification(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET is_archived = true
  WHERE id = p_notification_id
    AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_video_id TEXT DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_channel_id UUID DEFAULT NULL,
  p_actor_user_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
BEGIN
  -- Check if user wants this type of notification
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- If no preferences exist, create defaults
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id);
    v_preferences.comment_notifications := true;
    v_preferences.reply_notifications := true;
    v_preferences.like_notifications := false;
    v_preferences.subscription_notifications := true;
    v_preferences.mention_notifications := true;
    v_preferences.upload_notifications := true;
  END IF;
  
  -- Check if this notification type is enabled
  IF (p_type = 'comment' AND NOT v_preferences.comment_notifications) OR
     (p_type = 'reply' AND NOT v_preferences.reply_notifications) OR
     (p_type = 'like' AND NOT v_preferences.like_notifications) OR
     (p_type = 'subscription' AND NOT v_preferences.subscription_notifications) OR
     (p_type = 'mention' AND NOT v_preferences.mention_notifications) OR
     (p_type = 'upload' AND NOT v_preferences.upload_notifications) THEN
    RETURN NULL; -- User has disabled this notification type
  END IF;
  
  -- Don't notify users about their own actions
  IF p_actor_user_id = p_user_id THEN
    RETURN NULL;
  END IF;
  
  -- Create the notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    video_id,
    comment_id,
    channel_id,
    actor_user_id,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_video_id,
    p_comment_id,
    p_channel_id,
    p_actor_user_id,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function: Get or create notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences notification_preferences;
BEGIN
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  RETURN v_preferences;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update notification_preferences updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER notification_preferences_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Anyone can create notifications (typically done by triggers/functions)

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences';

COMMENT ON COLUMN notifications.type IS 'Type of notification: comment, like, subscription, mention, upload, reply';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read this notification';
COMMENT ON COLUMN notifications.is_archived IS 'Soft delete - archived notifications are hidden';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN notifications.metadata IS 'Additional data in JSON format';

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
