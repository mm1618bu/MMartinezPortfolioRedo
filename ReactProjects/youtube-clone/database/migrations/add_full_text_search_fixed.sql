-- Migration: Full-Text Search Implementation (Fixed)
-- Run this in Supabase SQL Editor
--
-- RELEVANCE RANKING ALGORITHM:
-- =============================
-- The search_videos function uses a sophisticated multi-factor relevance scoring system:
--
-- 1. Full-Text Search (Weight: 10x)
--    - Uses PostgreSQL tsvector/tsquery for semantic matching
--    - Considers word stems and variations
--
-- 2. Exact Title Match (Score: +50)
--    - Highest priority for perfect title matches
--
-- 3. Title Starts With Query (Score: +30)
--    - High priority for titles beginning with search term
--
-- 4. Title Contains Query (Score: +15)
--    - Medium priority for partial title matches
--
-- 5. Keyword Exact Match (Score: +25)
--    - High priority for exact keyword tag matches
--
-- 6. Keyword Partial Match (Score: +10)
--    - Medium priority for partial keyword matches
--
-- 7. Channel Name Match (Score: +12)
--    - Medium priority for channel name matches
--
-- 8. Description Match (Score: +5)
--    - Lower priority for description mentions
--
-- 9. Popularity Boost (Score: up to +20)
--    - Logarithmic scale: LOG(views + 1) * 2
--    - Capped at 20 to prevent dominance by viral videos
--
-- 10. Engagement Boost (Score: up to +10)
--     - Based on likes-to-views ratio: (likes/views) * 15
--     - Rewards videos with high engagement
--
-- 11. Recency Boost (Score: +8, +5, or +2)
--     - Last 7 days: +8 points
--     - Last 30 days: +5 points
--     - Last 90 days: +2 points
--     - Helps surface fresh content
--
-- Total Maximum Score: ~180 points
-- Videos are sorted by total relevance score (highest first)
--

-- =====================================================
-- 1. Enable Required Extensions
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =====================================================
-- 2. Add Full-Text Search Columns to Videos
-- =====================================================

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_videos_search_vector 
ON videos USING GIN (search_vector);

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
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.channel_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- 4. Create Tables
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  clicked_video_id TEXT REFERENCES videos(id) ON DELETE SET NULL,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

CREATE TABLE IF NOT EXISTS popular_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT UNIQUE NOT NULL,
  search_count INT DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_query_trgm ON popular_searches USING GIN (query gin_trgm_ops);

CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion TEXT UNIQUE NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_suggestions_trgm ON search_suggestions USING GIN (suggestion gin_trgm_ops);

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  query TEXT NOT NULL,
  total_searches INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  avg_results_count DECIMAL(8,2) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, query)
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);

-- =====================================================
-- 5. Search Functions
-- =====================================================

CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_partial_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  suggestion TEXT,
  category VARCHAR(50),
  source VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Video titles
    SELECT DISTINCT
      v.title as suggestion,
      'video'::VARCHAR(50) as category,
      'video'::VARCHAR(20) as source,
      v.views as sort_order
    FROM videos v
    WHERE v.title ILIKE '%' || p_partial_query || '%'
    ORDER BY v.views DESC
    LIMIT (p_limit / 2)
    
    UNION ALL
    
    -- Channel names
    SELECT DISTINCT
      v.channel_name as suggestion,
      'channel'::VARCHAR(50) as category,
      'channel'::VARCHAR(20) as source,
      v.views as sort_order
    FROM videos v
    WHERE v.channel_name ILIKE '%' || p_partial_query || '%'
    ORDER BY v.views DESC
    LIMIT (p_limit / 3)
    
    UNION ALL
    
    -- Keywords (if column exists and is not null)
    SELECT DISTINCT
      unnest(v.keywords) as suggestion,
      'keyword'::VARCHAR(50) as category,
      'keyword'::VARCHAR(20) as source,
      v.views as sort_order
    FROM videos v
    WHERE v.keywords IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM unnest(v.keywords) kw 
        WHERE kw ILIKE '%' || p_partial_query || '%'
      )
    LIMIT (p_limit / 3)
  ) results
  ORDER BY sort_order DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

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

CREATE OR REPLACE FUNCTION search_videos(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_sort_by TEXT DEFAULT 'relevance',
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
  channel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_score REAL
) AS $$
DECLARE
  v_ts_query tsquery;
BEGIN
  v_ts_query := plainto_tsquery('english', p_query);
  
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
    v.channel_name,
    v.created_at,
    -- Advanced relevance scoring algorithm
    (
      -- Full-text search rank (weighted heavily)
      ts_rank(v.search_vector, v_ts_query) * 10.0 +
      
      -- Exact title match (highest priority)
      CASE WHEN LOWER(v.title) = LOWER(p_query) THEN 50.0 ELSE 0 END +
      
      -- Title starts with query (high priority)
      CASE WHEN LOWER(v.title) LIKE LOWER(p_query) || '%' THEN 30.0 ELSE 0 END +
      
      -- Title contains query (medium priority)
      CASE WHEN LOWER(v.title) LIKE '%' || LOWER(p_query) || '%' THEN 15.0 ELSE 0 END +
      
      -- Keyword exact match (high priority)
      CASE WHEN v.keywords IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(v.keywords) kw 
        WHERE LOWER(kw) = LOWER(p_query)
      ) THEN 25.0 ELSE 0 END +
      
      -- Keyword partial match (medium priority)
      CASE WHEN v.keywords IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(v.keywords) kw 
        WHERE LOWER(kw) LIKE '%' || LOWER(p_query) || '%'
      ) THEN 10.0 ELSE 0 END +
      
      -- Channel name match (medium priority)
      CASE WHEN LOWER(v.channel_name) LIKE '%' || LOWER(p_query) || '%' THEN 12.0 ELSE 0 END +
      
      -- Description match (lower priority)
      CASE WHEN LOWER(v.description) LIKE '%' || LOWER(p_query) || '%' THEN 5.0 ELSE 0 END +
      
      -- Popularity boost (logarithmic scale to prevent dominance)
      LEAST(LOG(GREATEST(v.views, 1) + 1) * 2.0, 20.0) +
      
      -- Engagement boost (likes ratio)
      CASE WHEN v.views > 0 
        THEN LEAST((v.likes::FLOAT / NULLIF(v.views, 0)) * 15.0, 10.0)
        ELSE 0 
      END +
      
      -- Recency boost (decay over time)
      CASE 
        WHEN v.created_at > NOW() - INTERVAL '7 days' THEN 8.0
        WHEN v.created_at > NOW() - INTERVAL '30 days' THEN 5.0
        WHEN v.created_at > NOW() - INTERVAL '90 days' THEN 2.0
        ELSE 0
      END
    ) as relevance_score
  FROM videos v
  WHERE 
    v.search_vector @@ v_ts_query
    OR v.title ILIKE '%' || p_query || '%'
    OR v.description ILIKE '%' || p_query || '%'
    OR v.channel_name ILIKE '%' || p_query || '%'
    OR (v.keywords IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(v.keywords) kw 
      WHERE kw ILIKE '%' || p_query || '%'
    ))
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN 
      (
        ts_rank(v.search_vector, v_ts_query) * 10.0 +
        CASE WHEN LOWER(v.title) = LOWER(p_query) THEN 50.0 ELSE 0 END +
        CASE WHEN LOWER(v.title) LIKE LOWER(p_query) || '%' THEN 30.0 ELSE 0 END +
        CASE WHEN LOWER(v.title) LIKE '%' || LOWER(p_query) || '%' THEN 15.0 ELSE 0 END +
        CASE WHEN v.keywords IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(v.keywords) kw WHERE LOWER(kw) = LOWER(p_query)
        ) THEN 25.0 ELSE 0 END +
        CASE WHEN v.keywords IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(v.keywords) kw WHERE LOWER(kw) LIKE '%' || LOWER(p_query) || '%'
        ) THEN 10.0 ELSE 0 END +
        CASE WHEN LOWER(v.channel_name) LIKE '%' || LOWER(p_query) || '%' THEN 12.0 ELSE 0 END +
        CASE WHEN LOWER(v.description) LIKE '%' || LOWER(p_query) || '%' THEN 5.0 ELSE 0 END +
        LEAST(LOG(GREATEST(v.views, 1) + 1) * 2.0, 20.0) +
        CASE WHEN v.views > 0 THEN LEAST((v.likes::FLOAT / NULLIF(v.views, 0)) * 15.0, 10.0) ELSE 0 END +
        CASE 
          WHEN v.created_at > NOW() - INTERVAL '7 days' THEN 8.0
          WHEN v.created_at > NOW() - INTERVAL '30 days' THEN 5.0
          WHEN v.created_at > NOW() - INTERVAL '90 days' THEN 2.0
          ELSE 0
        END
      )
    ELSE 0 END DESC,
    CASE WHEN p_sort_by = 'date' THEN EXTRACT(EPOCH FROM v.created_at) ELSE 0 END DESC,
    CASE WHEN p_sort_by = 'views' THEN v.views ELSE 0 END DESC,
    v.views DESC -- Tiebreaker
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 6. Row Level Security
-- =====================================================

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
CREATE POLICY "Users can insert their own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;
CREATE POLICY "Users can delete their own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Popular searches are viewable by everyone" ON popular_searches;
CREATE POLICY "Popular searches are viewable by everyone"
  ON popular_searches FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Search suggestions are viewable by everyone" ON search_suggestions;
CREATE POLICY "Search suggestions are viewable by everyone"
  ON search_suggestions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Search analytics are viewable by everyone" ON search_analytics;
CREATE POLICY "Search analytics are viewable by everyone"
  ON search_analytics FOR SELECT
  USING (true);
