import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { getAllVideosFromSupabase } from '../utils/supabase';
import '../../styles/main.css';
import { useEffect, useState } from "react";

export default function VideoGrid() {
  const { data: videos = [], isLoading, error, refetch } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      console.log("📥 Loading videos from Supabase");
      const videos = await getAllVideosFromSupabase();
      console.log(`✅ Loaded ${videos.length} video(s) from Supabase`);
      return videos;
    },
  });

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
        <button onClick={() => refetch()} className="video-grid-refresh-button">
          Refresh
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="video-grid-empty">
          <p>No videos yet. Upload your first video!</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }) {
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
    <div onClick={handleCardClick} className="video-card">
      {/* Thumbnail/Video */}
      <div className="video-card-thumbnail-container">
        <div className="video-card-thumbnail-wrapper">
          <img
            src={video.thumbnail_url || "https://placehold.co/320x180?text=No+Thumbnail"}
            alt={video.title}
            className="video-card-thumbnail-image"
          />
          
          {/* Duration badge */}
          {video.duration > 0 && (
            <div className="video-card-duration-badge">
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
        </div>

        {timeAgo && (
          <div className="video-card-time">
            {timeAgo}
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
    </div>
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
