import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllVideosFromSupabase } from '../utils/supabase';
import '../../styles/main.css';

export default function Channel() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channelStats, setChannelStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0
  });

  useEffect(() => {
    fetchChannelData();
  }, []);

  const fetchChannelData = async () => {
    try {
      console.log("📥 Loading channel videos from Supabase");
      setLoading(true);
      
      const videos = await getAllVideosFromSupabase();
      console.log(`✅ Loaded ${videos.length} video(s)`);
      
      // Calculate channel statistics
      const stats = {
        totalVideos: videos.length,
        totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0),
        totalLikes: videos.reduce((sum, video) => sum + (video.likes || 0), 0)
      };
      
      setVideos(videos);
      setChannelStats(stats);
      setError(null);
    } catch (err) {
      console.error("❌ Error loading channel data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="channel-loading">
        <p>Loading channel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-error">
        <p>Error: {error}</p>
        <button onClick={fetchChannelData} className="channel-retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="channel-container">
      {/* Channel Header */}
      <div className="channel-header">
        <div className="channel-banner">
          <div className="channel-avatar">
            <span>{videos.length > 0 && videos[0].channel_name ? videos[0].channel_name.charAt(0).toUpperCase() : '📺'}</span>
          </div>
          <div className="channel-info">
            <h1 className="channel-name">{videos.length > 0 && videos[0].channel_name ? videos[0].channel_name : 'My Channel'}</h1>
            <div className="channel-meta">
              <span>{channelStats.totalVideos} videos</span>
              <span>•</span>
              <span>{channelStats.totalViews.toLocaleString()} views</span>
              <span>•</span>
              <span>{channelStats.totalLikes.toLocaleString()} likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Navigation */}
      <div className="channel-nav">
        <button className="channel-nav-button active">Videos</button>
        <button className="channel-nav-button">About</button>
      </div>

      {/* Videos Section */}
      <div className="channel-content">
        <div className="channel-section-header">
          <h2>Uploads</h2>
          <button onClick={fetchChannelData} className="channel-refresh-button">
            Refresh
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="channel-empty">
            <p>No videos uploaded yet. Start creating content!</p>
          </div>
        ) : (
          <div className="channel-video-grid">
            {videos.map((video) => (
              <ChannelVideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelVideoCard({ video }) {
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
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [video.created_at]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = () => {
    navigate(`/watch/${video.id}`);
  };

  return (
    <div onClick={handleVideoClick} className="channel-video-card">
      {/* Thumbnail */}
      <div className="channel-video-thumbnail">
        <img
          src={video.thumbnail_url || "https://placehold.co/320x180?text=No+Thumbnail"}
          alt={video.title}
        />
        {video.duration > 0 && (
          <div className="channel-video-duration">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="channel-video-info">
        <h3 className="channel-video-title">{video.title}</h3>
        
        <div className="channel-video-stats">
          <span>{video.views.toLocaleString()} views</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>

        {video.description && (
          <p className="channel-video-description">
            {video.description}
          </p>
        )}

        <div className="channel-video-engagement">
          <span>👍 {video.likes || 0}</span>
          <span>👎 {video.dislikes || 0}</span>
        </div>
      </div>
    </div>
  );
}
