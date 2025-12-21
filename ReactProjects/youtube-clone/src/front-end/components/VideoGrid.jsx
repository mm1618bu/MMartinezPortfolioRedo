import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { getAllVideosFromSupabase, supabase } from '../utils/supabase';
import { scoreAndRankVideos } from '../utils/videoScoringSystem';
import { VIDEO_CATEGORIES } from '../utils/homeFeedAPI';
import { getBannerAd } from '../utils/adSimulationEngine';
import BannerAd from './BannerAd.jsx';
import '../../styles/main.css';
import { useEffect, useState, useMemo } from "react";

export default function VideoGrid() {
  const [sortBy, setSortBy] = useState('score'); // 'score', 'newest', 'views'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bannerAd, setBannerAd] = useState(null);
  const [showAd, setShowAd] = useState(true);

  // Load a banner ad
  useEffect(() => {
    const ad = getBannerAd([selectedCategory].filter(Boolean));
    setBannerAd(ad);
  }, [selectedCategory]);
  
  const { data: videos = [], isLoading, error, refetch } = useQuery({
    queryKey: ['allVideos'], // Use same cache key as VideoPlayer
    queryFn: async () => {
      console.log("📥 Loading videos from Supabase");
      // Fetch videos with their categories
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          video_categories (category)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log(`✅ Loaded ${data.length} video(s) from Supabase`);
      return data;
    },
    staleTime: 1000 * 60 * 10, // Data stays fresh for 10 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  // Sort and filter videos based on selected options
  const sortedVideos = useMemo(() => {
    if (!videos.length) return [];
    
    // First, filter by category if one is selected
    let filteredVideos = videos;
    if (selectedCategory) {
      filteredVideos = videos.filter(video => {
        const videoCategories = video.video_categories?.map(vc => vc.category) || [];
        return videoCategories.includes(selectedCategory);
      });
    }
    
    // Then sort the filtered results
    switch (sortBy) {
      case 'score':
        return scoreAndRankVideos(filteredVideos);
      case 'newest':
        return [...filteredVideos].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      case 'views':
        return [...filteredVideos].sort((a, b) => 
          (b.views || 0) - (a.views || 0)
        );
      default:
        return filteredVideos;
    }
  }, [videos, sortBy, selectedCategory]);

  if (isLoading) {
    return (
      <div className="video-load-alert">
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label htmlFor="video-sort" className="visually-hidden">Sort videos by</label>
          <select 
            id="video-sort"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort videos by"
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
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

      {sortedVideos.length === 0 ? (
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

        {/* Category badges */}
        {video.video_categories && video.video_categories.length > 0 && (
          <div className="video-card-categories" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '8px'
          }}>
            {video.video_categories.slice(0, 3).map((vc, index) => (
              <span key={index} style={{
                padding: '2px 8px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {vc.category}
              </span>
            ))}
            {video.video_categories.length > 3 && (
              <span style={{
                padding: '2px 8px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                +{video.video_categories.length - 3}
              </span>
            )}
          </div>
        )}

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
