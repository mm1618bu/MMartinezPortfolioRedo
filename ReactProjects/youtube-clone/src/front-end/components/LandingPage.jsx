import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import '../../styles/main.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'trending', 'recent'

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(24);

      if (filter === 'trending') {
        query = supabase
          .from('videos')
          .select('*')
          .order('views', { ascending: false })
          .limit(24);
      } else if (filter === 'recent') {
        query = supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(24);
      }

      const { data, error } = await query;
      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [key, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) {
        return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  const handleVideoClick = (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  return (
    <div className="landing-page">
      {/* Compact Hero Section */}
      <section className="landing-hero-compact">
        <div className="landing-hero-content">
          <h1 className="landing-title">
            Discover Amazing <span className="landing-title-highlight">Videos</span>
          </h1>
          <p className="landing-subtitle">
            Watch, share, and explore content from creators worldwide
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="landing-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Videos
          </button>
          <button 
            className={`filter-tab ${filter === 'trending' ? 'active' : ''}`}
            onClick={() => setFilter('trending')}
          >
            🔥 Trending
          </button>
          <button 
            className={`filter-tab ${filter === 'recent' ? 'active' : ''}`}
            onClick={() => setFilter('recent')}
          >
            🆕 Recent
          </button>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="landing-videos">
        {loading ? (
          <div className="loading-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="video-skeleton">
                <div className="skeleton-thumbnail"></div>
                <div className="skeleton-details">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-info"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="no-videos">
            <div className="no-videos-icon">📹</div>
            <h3>No videos yet</h3>
            <p>Be the first to upload!</p>
            <button className="landing-btn landing-btn-primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className="video-card"
                onClick={() => handleVideoClick(video.id)}
              >
                <div className="video-thumbnail-wrapper">
                  <img 
                    src={video.thumbnail_url || 'https://via.placeholder.com/320x180?text=No+Thumbnail'} 
                    alt={video.title}
                    className="video-thumbnail"
                  />
                  <div className="video-duration">{formatDuration(video.duration)}</div>
                </div>
                <div className="video-details">
                  <h3 className="video-title">{video.title}</h3>
                  <p className="video-channel">{video.channel_name || 'Unknown Channel'}</p>
                  <div className="video-meta">
                    <span>{formatViews(video.views)} views</span>
                    <span>•</span>
                    <span>{formatTimeAgo(video.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Ready to Share Your Story?</h2>
          <p className="landing-cta-text">
            Join our community and start creating today
          </p>
          <button className="landing-btn landing-btn-large" onClick={() => navigate('/login')}>
            Ger Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2025 VideoShare. All rights reserved.</p>
      </footer>
    </div>
  );
}
