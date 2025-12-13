-- Migration: Full-Text Search Implementation
-- Description: Adds full-text search capabilities with PostgreSQL's built-in search,
--              search history, suggestions, and analytics

-- =====================================================
-- 1. Enable Required Extensions
-- =====================================================

-- Enable pg_trgm for similarity search and suggestions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable unaccent for accent-insensitive search (optional)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =====================================================
-- 2. Add Full-Text Search Columns to Videos
-- =====================================================

-- Add tsvector column for full-text search
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_videos_search_vector 
ON videos USING GIN (search_vector);

-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm 
ON videos USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_videos_description_trgm 
ON videos USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_videos_channel_trgm 
ON videos USING GIN (channel_name gin_trgm_ops);

-- =====================================================
-- 3. Function to Update Search Vector
-- =====================================================

CREATE OR REPLACE FUNCTION update_video_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Create search vector from title (A weight), description (B weight), 
  -- channel_name (C weight), and tags (D weight)
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.channel_name, '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_video_search_vector_trigger ON videos;
CREATE TRIGGER update_video_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, description, channel_name
ON videos
FOR EACH ROW
EXECUTE FUNCTION update_video_search_vector();

-- Update existing videos
UPDATE videos 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(channel_name, '')), 'C')
WHERE search_vector IS NULL;

-- =====================================================
-- 4. Search History Table
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  clicked_video_id TEXT REFERENCES videos(id) ON DELETE SET NULL,
  filters JSONB, -- Store applied filters (quality, duration, date, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for search history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- =====================================================
-- 5. Popular Searches Table (Aggregated)
-- =====================================================

CREATE TABLE IF NOT EXISTS popular_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT UNIQUE NOT NULL,
  search_count INT DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for popular searches
CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_query_trgm ON popular_searches USING GIN (query gin_trgm_ops);

-- =====================================================
-- 6. Search Suggestions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion TEXT UNIQUE NOT NULL,
  category VARCHAR(50), -- 'trending', 'channel', 'video', 'topic'
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for suggestions
CREATE INDEX IF NOT EXISTS idx_search_suggestions_active ON search_suggestions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_search_suggestions_score ON search_suggestions(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_trgm ON search_suggestions USING GIN (suggestion gin_trgm_ops);

-- =====================================================
-- 7. Search Analytics Table
-- =====================================================

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  query TEXT NOT NULL,
  total_searches INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  avg_results_count DECIMAL(8,2) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, query)
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);

-- =====================================================
-- 8. Full-Text Search Function
-- =====================================================

CREATE OR REPLACE FUNCTION search_videos(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_sort_by TEXT DEFAULT 'relevance', -- 'relevance', 'date', 'views', 'rating'
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  id TEXT,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration INT,
  views INT,
  likes INT,
  dislikes INT,
  channel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  quality VARCHAR(10),
  is_public BOOLEAN,
  rank REAL
) AS $$
DECLARE
  v_ts_query tsquery;
  v_quality TEXT;
  v_min_duration INT;
  v_max_duration INT;
  v_date_from TIMESTAMP;
  v_date_to TIMESTAMP;
  v_channel TEXT;
BEGIN
  -- Convert query to tsquery
  v_ts_query := plainto_tsquery('english', p_query);
  
  -- Extract filters from JSONB
  v_quality := p_filters->>'quality';
  v_min_duration := (p_filters->>'min_duration')::INT;
  v_max_duration := (p_filters->>'max_duration')::INT;
  v_date_from := (p_filters->>'date_from')::TIMESTAMP;
  v_date_to := (p_filters->>'date_to')::TIMESTAMP;
  v_channel := p_filters->>'channel';

  RETURN QUERY
  SELECT 
    v.id,
    v.title,
    v.description,
    v.thumbnail_url,
    v.video_url,
    v.duration,
    v.views,
    v.likes,
    v.dislikes,
    v.channel_name,
    v.created_at,
    v.quality,
    v.is_public,
    ts_rank(v.search_vector, v_ts_query) as rank
  FROM videos v
  WHERE 
    v.is_public = true
    AND (
      v.search_vector @@ v_ts_query
      OR v.title ILIKE '%' || p_query || '%'
      OR v.description ILIKE '%' || p_query || '%'
      OR v.channel_name ILIKE '%' || p_query || '%'
    )
    AND (v_quality IS NULL OR v.quality = v_quality)
    AND (v_min_duration IS NULL OR v.duration >= v_min_duration)
    AND (v_max_duration IS NULL OR v.duration <= v_max_duration)
    AND (v_date_from IS NULL OR v.created_at >= v_date_from)
    AND (v_date_to IS NULL OR v.created_at <= v_date_to)
    AND (v_channel IS NULL OR v.channel_name ILIKE '%' || v_channel || '%')
  ORDER BY
    CASE 
      WHEN p_sort_by = 'relevance' THEN ts_rank(v.search_vector, v_ts_query)
      ELSE 0
    END DESC,
    CASE 
      WHEN p_sort_by = 'date' THEN EXTRACT(EPOCH FROM v.created_at)
      ELSE 0
    END DESC,
    CASE 
      WHEN p_sort_by = 'views' THEN v.views
      ELSE 0
    END DESC,
    CASE 
      WHEN p_sort_by = 'rating' THEN (v.likes::FLOAT / NULLIF(v.likes + v.dislikes, 0))
      ELSE 0
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 9. Search Suggestions Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_partial_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  suggestion TEXT,
  category VARCHAR(50),
  source VARCHAR(20) -- 'history', 'popular', 'video', 'channel'
) AS $$
BEGIN
  RETURN QUERY
  -- Popular searches matching the query
  SELECT 
    ps.query as suggestion,
    'popular'::VARCHAR(50) as category,
    'popular'::VARCHAR(20) as source
  FROM popular_searches ps
  WHERE ps.query ILIKE p_partial_query || '%'
  ORDER BY ps.search_count DESC
  LIMIT p_limit / 3
  
  UNION ALL
  
  -- Video titles matching the query
  SELECT DISTINCT
    v.title as suggestion,
    'video'::VARCHAR(50) as category,
    'video'::VARCHAR(20) as source
  FROM videos v
  WHERE 
    v.is_public = true
    AND v.title ILIKE '%' || p_partial_query || '%'
  ORDER BY v.views DESC
  LIMIT p_limit / 3
  
  UNION ALL
  
  -- Channel names matching the query
  SELECT DISTINCT
    v.channel_name as suggestion,
    'channel'::VARCHAR(50) as category,
    'channel'::VARCHAR(20) as source
  FROM videos v
  WHERE 
    v.is_public = true
    AND v.channel_name ILIKE p_partial_query || '%'
  ORDER BY v.views DESC
  LIMIT p_limit / 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 10. Trending Searches Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_trending_searches(
  p_hours INT DEFAULT 24,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query,
    COUNT(*)::BIGINT as search_count
  FROM search_history sh
  WHERE sh.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY sh.query
  ORDER BY search_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 11. Related Searches Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_related_searches(
  p_query TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE(
  related_query TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.query as related_query,
    similarity(ps.query, p_query) as relevance
  FROM popular_searches ps
  WHERE 
    ps.query != p_query
    AND similarity(ps.query, p_query) > 0.3
  ORDER BY relevance DESC, ps.search_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 12. Log Search Function
-- =====================================================

CREATE OR REPLACE FUNCTION log_search(
  p_user_id UUID,
  p_query TEXT,
  p_results_count INT,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_search_id UUID;
BEGIN
  -- Insert into search history
  INSERT INTO search_history (user_id, query, results_count, filters)
  VALUES (p_user_id, p_query, p_results_count, p_filters)
  RETURNING id INTO v_search_id;
  
  -- Update or insert into popular searches
  INSERT INTO popular_searches (query, search_count, last_searched_at)
  VALUES (p_query, 1, NOW())
  ON CONFLICT (query) 
  DO UPDATE SET 
    search_count = popular_searches.search_count + 1,
    last_searched_at = NOW(),
    updated_at = NOW();
  
  RETURN v_search_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. Update Search Analytics Function
-- =====================================================

CREATE OR REPLACE FUNCTION update_search_analytics()
RETURNS void AS $$
BEGIN
  -- Aggregate yesterday's search data
  INSERT INTO search_analytics (date, query, total_searches, unique_users, avg_results_count)
  SELECT 
    DATE(created_at) as date,
    query,
    COUNT(*) as total_searches,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(results_count) as avg_results_count
  FROM search_history
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(created_at), query
  ON CONFLICT (date, query) DO UPDATE SET
    total_searches = EXCLUDED.total_searches,
    unique_users = EXCLUDED.unique_users,
    avg_results_count = EXCLUDED.avg_results_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 14. Row Level Security (RLS)
-- =====================================================

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Search history: Users can only see their own
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Popular searches: Public read
CREATE POLICY "Popular searches are viewable by everyone"
  ON popular_searches FOR SELECT
  USING (true);

-- Search suggestions: Public read
CREATE POLICY "Search suggestions are viewable by everyone"
  ON search_suggestions FOR SELECT
  USING (is_active = true);

-- Search analytics: Public read
CREATE POLICY "Search analytics are viewable by everyone"
  ON search_analytics FOR SELECT
  USING (true);

-- =====================================================
-- 15. Initial Data - Search Suggestions
-- =====================================================

-- Insert some common search suggestions
INSERT INTO search_suggestions (suggestion, category, relevance_score) VALUES
  ('how to', 'trending', 1.0),
  ('tutorial', 'trending', 0.95),
  ('review', 'trending', 0.9),
  ('gameplay', 'trending', 0.85),
  ('music', 'trending', 0.95),
  ('funny', 'trending', 0.8),
  ('compilation', 'trending', 0.75),
  ('vlog', 'trending', 0.85),
  ('news', 'trending', 0.9),
  ('trailer', 'trending', 0.85)
ON CONFLICT (suggestion) DO NOTHING;

-- =====================================================
-- 16. Triggers for Analytics
-- =====================================================

-- Trigger to update search analytics daily (requires pg_cron or external scheduler)
-- For manual updates, run: SELECT update_search_analytics();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE search_history IS 'User search history with filters and click tracking';
COMMENT ON TABLE popular_searches IS 'Aggregated popular search queries for suggestions';
COMMENT ON TABLE search_suggestions IS 'Curated search suggestions by category';
COMMENT ON TABLE search_analytics IS 'Daily aggregated search analytics';

COMMENT ON FUNCTION search_videos IS 'Full-text search with filters and sorting options';
COMMENT ON FUNCTION get_search_suggestions IS 'Get autocomplete suggestions based on partial query';
COMMENT ON FUNCTION get_trending_searches IS 'Get trending searches within specified time window';
COMMENT ON FUNCTION get_related_searches IS 'Find related searches using similarity';
COMMENT ON FUNCTION log_search IS 'Log search query and update popular searches';
COMMENT ON FUNCTION update_search_analytics IS 'Aggregate daily search analytics';

-- =====================================================
-- Performance Notes
-- =====================================================

-- The following indexes are created for optimal performance:
-- 1. GIN index on search_vector for fast full-text search
-- 2. Trigram indexes for fuzzy matching and suggestions
-- 3. Indexes on foreign keys and frequently queried columns
-- 4. Partial indexes where appropriate (e.g., is_active = true)

-- For very large datasets, consider:
-- 1. Partitioning search_history by date
-- 2. Using materialized views for popular_searches
-- 3. Implementing search result caching at application level
-- 4. Using external search engines (Elasticsearch, Algolia) for advanced features
