import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAllVideosFromSupabase, supabase } from '../utils/supabase';
import { getMockVideos } from '../utils/mockData';
import { scoreAndRankVideos } from '../utils/videoScoringSystem';
import { VIDEO_CATEGORIES } from '../utils/homeFeedAPI';
import { getBannerAd } from '../utils/adSimulationEngine';
import BannerAd from './BannerAd.jsx';
import '../../styles/main.css';
import { useEffect, useState, useMemo, useRef } from "react";

export default function VideoGrid() {
  const [sortBy, setSortBy] = useState('score'); // 'score', 'newest', 'views'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bannerAd, setBannerAd] = useState(null);
  const [showAd, setShowAd] = useState(true);
  const observerTarget = useRef(null);

  // Load a banner ad
  useEffect(() => {
    const ad = getBannerAd([selectedCategory].filter(Boolean));
    setBannerAd(ad);
  }, [selectedCategory]);

  const VIDEOS_PER_PAGE = 12;
  
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = useInfiniteQuery({
    queryKey: ['allVideos', selectedCategory], // Include category in cache key
    queryFn: async ({ pageParam = 0 }) => {
      console.log(`📥 Loading videos (page: ${pageParam})`);
      console.log('🔍 Supabase client:', !!supabase);
      
      let query = supabase
        .from('videos')
        .select('*', { count: 'exact' });

      // Filter by category if selected
      if (selectedCategory) {
        // We need to filter on the client side since contains doesn't work well with nested objects
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      console.log('🚀 Executing Supabase query...');
      const { data, error, count } = await query
        .range(pageParam, pageParam + VIDEOS_PER_PAGE - 1);
      
      console.log('📊 Query result:', { dataCount: data?.length, error: error?.message, totalCount: count });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      // Filter by category on client side if needed
      // Note: video_categories table doesn't exist, using meta_tags or keywords instead
      let filteredData = data;
      if (selectedCategory) {
        filteredData = data.filter(video => {
          const metaTags = video.meta_tags?.toLowerCase() || '';
          return metaTags.includes(selectedCategory.toLowerCase());
        });
      }
      
      console.log(`✅ Loaded ${filteredData.length} video(s) from Supabase`);
      
      return {
        videos: filteredData,
        nextPage: pageParam + VIDEOS_PER_PAGE,
        hasMore: count > pageParam + VIDEOS_PER_PAGE
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    staleTime: 1000 * 60 * 10, // Data stays fresh for 10 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  // Flatten all pages into a single array of videos
  const videos = useMemo(() => {
    return data?.pages.flatMap(page => page.videos) || [];
  }, [data]);

  // Sort videos based on selected option (filtering by category is now done in the query)
  const sortedVideos = useMemo(() => {
    if (!videos.length) return [];
    
    // Sort the videos
    switch (sortBy) {
      case 'score':
        return scoreAndRankVideos(videos);
      case 'newest':
        return [...videos].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      case 'views':
        return [...videos].sort((a, b) => 
          (b.views || 0) - (a.views || 0)
        );
      default:
        return videos;
    }
  }, [videos, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('📍 Loading more videos...');
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="video-load-alert">
        <div className="loading-spinner"></div>
        <p>Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-grid-error">
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()} className="video-grid-retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="video-grid-container">
      <div className="video-grid-header">
        <h2 className="video-grid-title">Video Gallery</h2>
        <div className="video-grid-controls">
          <label htmlFor="video-sort" className="visually-hidden">Sort videos by</label>
          <select 
            id="video-sort"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort videos by"
            className="video-sort-select"
          >
            <option value="score">🎯 Smart Ranking</option>
            <option value="newest">🆕 Newest First</option>
            <option value="views">👁️ Most Viewed</option>
          </select>
          <button onClick={() => refetch()} aria-label="Refresh video list" className="video-grid-refresh-button">
            Refresh
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="category-chips">
        <button
          className={`chip ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {VIDEO_CATEGORIES.map(category => (
          <button
            key={category}
            className={`chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {sortedVideos.length === 0 && !isLoading ? (
        <div className="video-grid-empty">
          <p>
            {selectedCategory 
              ? `No ${selectedCategory} videos found. Try a different category!`
              : 'No videos yet. Upload your first video!'}
          </p>
        </div>
      ) : (
        <>
          {/* Show banner ad after first 4 videos */}
          <div className="video-grid">
            {sortedVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} showScore={sortBy === 'score'} />
            ))}
          </div>
          
          {sortedVideos.length > 4 && showAd && bannerAd && (
            <BannerAd ad={bannerAd} onClose={() => setShowAd(false)} />
          )}
          
          {sortedVideos.length > 4 && (
            <div className="video-grid">
              {sortedVideos.slice(4).map((video) => (
                <VideoCard key={video.id} video={video} showScore={sortBy === 'score'} />
              ))}
            </div>
          )}

          {/* Infinite scroll loading indicator */}
          {isFetchingNextPage && (
            <div className="video-load-alert" style={{ margin: '40px auto', textAlign: 'center' }}>
              <div className="loading-spinner"></div>
              <p>Loading more videos...</p>
            </div>
          )}

          {/* Infinite scroll trigger point */}
          <div 
            ref={observerTarget} 
            style={{ height: '20px', margin: '20px 0' }}
            aria-hidden="true"
          />

          {/* End of content indicator */}
          {!hasNextPage && sortedVideos.length > 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666',
              fontSize: '14px'
            }}>
              <p>🎬 You've reached the end! That's all the videos for now.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VideoCard({ video, showScore = false }) {
  const [timeAgo, setTimeAgo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const updateTimeAgo = () => {
      if (video.created_at) {
        const now = new Date();
        const uploaded = new Date(video.created_at);
        const seconds = Math.floor((now - uploaded) / 1000);
        
        if (seconds < 60) setTimeAgo(`${seconds}s ago`);
        else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
        else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
        else if (seconds < 604800) setTimeAgo(`${Math.floor(seconds / 86400)}d ago`);
        else if (seconds < 2592000) setTimeAgo(`${Math.floor(seconds / 604800)}w ago`);
        else if (seconds < 31536000) setTimeAgo(`${Math.floor(seconds / 2592000)}mo ago`);
        else setTimeAgo(`${Math.floor(seconds / 31536000)}y ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [video.created_at]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = () => {
    console.log(`🖱️ Navigating to video: ${video.title}`);
    navigate(`/watch/${video.id}`);
  };

  return (
    <article 
      onClick={handleCardClick} 
      className="video-card"
      role="button"
      tabIndex={0}
      aria-label={`Watch ${video.title}, ${video.views.toLocaleString()} views, uploaded ${timeAgo}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Thumbnail/Video */}
      <div className="video-card-thumbnail-container">
        <div className="video-card-thumbnail-wrapper">
          <img
            src={video.thumbnail_url || "https://placehold.co/320x180?text=No+Thumbnail"}
            alt={`Thumbnail for ${video.title}`}
            className="video-card-thumbnail-image"
            loading="lazy"
          />
          
          {/* Duration badge */}
          {video.duration > 0 && (
            <div className="video-card-duration-badge" aria-label={`Duration: ${formatDuration(video.duration)}`}>
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Privacy badge */}
          {video.is_public === false && (
            <div className="video-card-privacy-badge">
              🔒 Private
            </div>
          )}

          {video.video_url && (
            <div className="video-card-play-button">
              <div className="video-card-play-icon" />
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="video-card-info">
        <h3 className="video-card-title">
          {video.title}
        </h3>
        
        {video.description && (
          <p className="video-card-description">
            {video.description}
          </p>
        )}
        
        <div className="video-card-views">
          {video.views.toLocaleString()} views
          {video.quality && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 6px',
              backgroundColor: '#667eea20',
              color: '#667eea',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {video.quality}
            </span>
          )}
          {showScore && video.score && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 6px',
              backgroundColor: '#10b98120',
              color: '#10b981',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: '600'
            }} title={`Engagement: ${video.score.breakdown.engagement.toFixed(0)} | Recency: ${video.score.breakdown.recency.toFixed(0)} | Quality: ${video.score.breakdown.quality.toFixed(0)}`}>
              ⭐ {video.score.total.toFixed(0)}
            </span>
          )}
        </div>

        {timeAgo && (
          <div className="video-card-time">
            {timeAgo}
          </div>
        )}

        {/* Category badges - removed since video_categories table doesn't exist */}

        {video.keywords && video.keywords.length > 0 && (
          <div className="video-card-keywords">
            {video.keywords.slice(0, 3).map((keyword, index) => (
              <span key={index} className="video-card-keyword">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}
