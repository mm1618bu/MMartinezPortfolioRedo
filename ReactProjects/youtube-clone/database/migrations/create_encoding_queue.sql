-- Migration: Video Encoding Queue System
-- Run this in Supabase SQL Editor
--
-- This creates an asynchronous encoding queue for video processing
-- Videos are uploaded first, then queued for encoding in the background

-- =====================================================
-- 1. Create Encoding Jobs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS encoding_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Job status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  -- Status values: 'queued', 'processing', 'completed', 'failed', 'cancelled'
  
  priority INT DEFAULT 5,
  -- Priority: 1 (highest) to 10 (lowest)
  
  -- Processing details
  input_file_url TEXT NOT NULL,
  input_file_size BIGINT,
  input_resolution VARCHAR(20),
  
  -- Output configuration
  output_formats JSONB DEFAULT '["720p", "480p", "360p"]'::jsonb,
  -- Array of target formats to encode
  
  output_files JSONB DEFAULT '{}'::jsonb,
  -- Map of format -> output file URL
  
  -- Progress tracking
  progress INT DEFAULT 0,
  -- Progress percentage: 0-100
  
  current_step VARCHAR(100),
  -- Current processing step description
  
  -- Timing
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  -- Processing metadata
  processing_time_seconds INT,
  worker_id TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
  CONSTRAINT valid_progress CHECK (progress BETWEEN 0 AND 100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_encoding_jobs_status ON encoding_jobs(status);
CREATE INDEX IF NOT EXISTS idx_encoding_jobs_video_id ON encoding_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_encoding_jobs_user_id ON encoding_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_encoding_jobs_priority ON encoding_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_encoding_jobs_queued_at ON encoding_jobs(queued_at);
CREATE INDEX IF NOT EXISTS idx_encoding_jobs_status_priority ON encoding_jobs(status, priority DESC, queued_at);

-- =====================================================
-- 2. Create Encoding Queue Statistics Table
-- =====================================================

CREATE TABLE IF NOT EXISTS encoding_queue_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Counters
  jobs_queued INT DEFAULT 0,
  jobs_processing INT DEFAULT 0,
  jobs_completed INT DEFAULT 0,
  jobs_failed INT DEFAULT 0,
  jobs_cancelled INT DEFAULT 0,
  
  -- Performance metrics
  avg_processing_time_seconds DECIMAL(10,2),
  total_processing_time_seconds BIGINT DEFAULT 0,
  total_bytes_processed BIGINT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

-- =====================================================
-- 3. Functions
-- =====================================================

-- Function to create an encoding job
CREATE OR REPLACE FUNCTION create_encoding_job(
  p_video_id TEXT,
  p_user_id UUID,
  p_input_file_url TEXT,
  p_input_file_size BIGINT,
  p_input_resolution VARCHAR(20) DEFAULT NULL,
  p_output_formats JSONB DEFAULT '["720p", "480p", "360p"]'::jsonb,
  p_priority INT DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO encoding_jobs (
    video_id,
    user_id,
    input_file_url,
    input_file_size,
    input_resolution,
    output_formats,
    priority
  ) VALUES (
    p_video_id,
    p_user_id,
    p_input_file_url,
    p_input_file_size,
    p_input_resolution,
    p_output_formats,
    p_priority
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next job from queue
CREATE OR REPLACE FUNCTION get_next_encoding_job()
RETURNS TABLE(
  job_id UUID,
  video_id TEXT,
  input_file_url TEXT,
  output_formats JSONB,
  priority INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ej.id as job_id,
    ej.video_id,
    ej.input_file_url,
    ej.output_formats,
    ej.priority
  FROM encoding_jobs ej
  WHERE ej.status = 'queued'
    AND ej.retry_count < ej.max_retries
  ORDER BY 
    ej.priority ASC,
    ej.queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to update job status
CREATE OR REPLACE FUNCTION update_encoding_job_status(
  p_job_id UUID,
  p_status VARCHAR(50),
  p_progress INT DEFAULT NULL,
  p_current_step VARCHAR(100) DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE encoding_jobs
  SET 
    status = p_status,
    progress = COALESCE(p_progress, progress),
    current_step = COALESCE(p_current_step, current_step),
    error_message = p_error_message,
    started_at = CASE 
      WHEN p_status = 'processing' AND started_at IS NULL 
      THEN NOW() 
      ELSE started_at 
    END,
    completed_at = CASE 
      WHEN p_status IN ('completed', 'failed', 'cancelled') 
      THEN NOW() 
      ELSE completed_at 
    END,
    processing_time_seconds = CASE
      WHEN p_status IN ('completed', 'failed', 'cancelled') AND started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (NOW() - started_at))::INT
      ELSE processing_time_seconds
    END,
    updated_at = NOW()
  WHERE id = p_job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get encoding job status
CREATE OR REPLACE FUNCTION get_encoding_job_status(p_video_id TEXT)
RETURNS TABLE(
  job_id UUID,
  status VARCHAR(50),
  progress INT,
  current_step VARCHAR(100),
  error_message TEXT,
  output_files JSONB,
  queued_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ej.id,
    ej.status,
    ej.progress,
    ej.current_step,
    ej.error_message,
    ej.output_files,
    ej.queued_at,
    ej.started_at,
    ej.completed_at
  FROM encoding_jobs ej
  WHERE ej.video_id = p_video_id
  ORDER BY ej.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's encoding jobs
CREATE OR REPLACE FUNCTION get_user_encoding_jobs(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  job_id UUID,
  video_id TEXT,
  video_title TEXT,
  status VARCHAR(50),
  progress INT,
  current_step VARCHAR(100),
  queued_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ej.id,
    ej.video_id,
    v.title,
    ej.status,
    ej.progress,
    ej.current_step,
    ej.queued_at,
    ej.started_at,
    ej.completed_at
  FROM encoding_jobs ej
  LEFT JOIN videos v ON v.id = ej.video_id
  WHERE ej.user_id = p_user_id
  ORDER BY ej.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel encoding job
CREATE OR REPLACE FUNCTION cancel_encoding_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE encoding_jobs
  SET 
    status = 'cancelled',
    updated_at = NOW(),
    completed_at = NOW()
  WHERE id = p_job_id
    AND status IN ('queued', 'processing');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Triggers
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_encoding_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS encoding_jobs_updated_at ON encoding_jobs;
CREATE TRIGGER encoding_jobs_updated_at
  BEFORE UPDATE ON encoding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_encoding_job_timestamp();

-- =====================================================
-- 5. Row Level Security
-- =====================================================

ALTER TABLE encoding_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE encoding_queue_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own encoding jobs
DROP POLICY IF EXISTS "Users can view their own encoding jobs" ON encoding_jobs;
CREATE POLICY "Users can view their own encoding jobs"
  ON encoding_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create encoding jobs
DROP POLICY IF EXISTS "Users can create encoding jobs" ON encoding_jobs;
CREATE POLICY "Users can create encoding jobs"
  ON encoding_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own encoding jobs (for cancellation)
DROP POLICY IF EXISTS "Users can update their own encoding jobs" ON encoding_jobs;
CREATE POLICY "Users can update their own encoding jobs"
  ON encoding_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Stats are viewable by everyone
DROP POLICY IF EXISTS "Queue stats are public" ON encoding_queue_stats;
CREATE POLICY "Queue stats are public"
  ON encoding_queue_stats FOR SELECT
  USING (true);

-- =====================================================
-- 6. Initial Data
-- =====================================================

-- Create today's stats entry
INSERT INTO encoding_queue_stats (date) 
VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;
