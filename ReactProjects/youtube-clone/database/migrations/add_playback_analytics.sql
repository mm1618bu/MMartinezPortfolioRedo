-- Migration: Add playback analytics tracking
-- Date: 2025-12-13

-- Create playback_sessions table to track individual viewing sessions
CREATE TABLE IF NOT EXISTS playback_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  total_watch_time INTEGER DEFAULT 0, -- in seconds
  completion_percentage DECIMAL(5,2) DEFAULT 0, -- 0-100
  playback_speed DECIMAL(3,2) DEFAULT 1.0,
  quality_level VARCHAR(20),
  device_type VARCHAR(50),
  browser VARCHAR(50),
  country VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create playback_events table for granular tracking
CREATE TABLE IF NOT EXISTS playback_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES playback_sessions(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'play', 'pause', 'seek', 'ended', 'quality_change', 'speed_change'
  timestamp_seconds DECIMAL(10,2), -- position in video
  event_data JSONB, -- additional event-specific data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create watch_history table for user's viewing history
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  last_position DECIMAL(10,2) DEFAULT 0, -- last watched position in seconds
  watch_time INTEGER DEFAULT 0, -- total time watched in seconds
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_playback_sessions_video_id ON playback_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_user_id ON playback_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_created_at ON playback_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_playback_events_session_id ON playback_events(session_id);
CREATE INDEX IF NOT EXISTS idx_playback_events_video_id ON playback_events(video_id);
CREATE INDEX IF NOT EXISTS idx_playback_events_event_type ON playback_events(event_type);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_video_id ON watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_last_watched ON watch_history(last_watched_at);

-- Add RLS policies
ALTER TABLE playback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- Playback sessions: Users can view their own sessions, video owners can view sessions for their videos
CREATE POLICY "Users can view their own playback sessions"
ON playback_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Video owners can view sessions for their videos"
ON playback_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = playback_sessions.video_id 
    AND videos.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert playback sessions"
ON playback_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own sessions"
ON playback_sessions FOR UPDATE
USING (user_id = auth.uid() OR user_id IS NULL);

-- Playback events: Similar policies
CREATE POLICY "Users can view their session events"
ON playback_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM playback_sessions 
    WHERE playback_sessions.id = playback_events.session_id 
    AND playback_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Video owners can view events for their videos"
ON playback_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = playback_events.video_id 
    AND videos.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert playback events"
ON playback_events FOR INSERT
WITH CHECK (true);

-- Watch history: Users can only see and manage their own history
CREATE POLICY "Users can view their own watch history"
ON watch_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own watch history"
ON watch_history FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own watch history"
ON watch_history FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own watch history"
ON watch_history FOR DELETE
USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE playback_sessions IS 'Tracks individual video viewing sessions with aggregate metrics';
COMMENT ON TABLE playback_events IS 'Stores granular playback events (play, pause, seek, etc.)';
COMMENT ON TABLE watch_history IS 'User watch history with resume position';
COMMENT ON COLUMN playback_sessions.total_watch_time IS 'Total seconds watched in this session';
COMMENT ON COLUMN playback_sessions.completion_percentage IS 'Percentage of video completed (0-100)';
COMMENT ON COLUMN watch_history.last_position IS 'Last playback position in seconds for resume';
COMMENT ON COLUMN watch_history.completed IS 'Whether user watched 90%+ of the video';
