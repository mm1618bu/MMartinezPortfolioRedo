import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserWatchHistory, removeFromWatchHistory, clearWatchHistory } from '../utils/playbackAnalytics';
import { supabase } from '../utils/supabase';
import '../../styles/main.css';

export default function WatchHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        setCurrentUser(user);

        // Load watch history
        const watchHistory = await getUserWatchHistory(user.id);
        setHistory(watchHistory);
      } catch (error) {
        console.error('Error loading watch history:', error);
        setMessage('❌ Error loading watch history');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndHistory();
  }, [navigate]);

  const handleRemoveVideo = async (videoId) => {
    if (!currentUser) return;

    try {
      await removeFromWatchHistory(currentUser.id, videoId);
      setHistory(history.filter(item => item.video_id !== videoId));
      setMessage('✅ Video removed from history');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error removing video:', error);
      setMessage('❌ Error removing video');
    }
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to clear your entire watch history? This cannot be undone.')) {
      return;
    }

    try {
      await clearWatchHistory(currentUser.id);
      setHistory([]);
      setMessage('✅ Watch history cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      setMessage('❌ Error clearing history');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getProgressPercentage = (watchTime, duration) => {
    if (!duration || duration === 0) return 0;
    return Math.min((watchTime / duration) * 100, 100);
  };

  if (loading) {
    return (
      <div className="watch-history-container">
        <div className="watch-history-loading">Loading watch history...</div>
      </div>
    );
  }

  return (
    <div className="watch-history-container">
      <div className="watch-history-header">
        <h1>Watch History</h1>
        {history.length > 0 && (
          <button onClick={handleClearAll} className="btn-clear-history">
            Clear All History
          </button>
        )}
      </div>

      {message && (
        <div className={`history-message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {history.length === 0 ? (
        <div className="no-history">
          <p>No watch history yet</p>
          <p>Videos you watch will appear here</p>
          <button onClick={() => navigate('/')} className="btn-browse">
            Browse Videos
          </button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => {
            const video = item.videos;
            if (!video) return null;

            const progress = getProgressPercentage(item.watch_time, video.duration);

            return (
              <div key={item.id} className="history-item">
                <div 
                  className="history-thumbnail"
                  onClick={() => navigate(`/watch/${video.id}`)}
                >
                  <img
                    src={video.thumbnail_url || 'https://placehold.co/320x180?text=No+Thumbnail'}
                    alt={video.title}
                  />
                  {item.last_position > 0 && (
                    <>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {!item.completed && item.last_position > 5 && (
                        <div className="resume-indicator">
                          {formatDuration(item.last_position)}
                        </div>
                      )}
                    </>
                  )}
                  {item.completed && (
                    <div className="completed-badge">✓ Watched</div>
                  )}
                </div>

                <div className="history-details">
                  <h3 onClick={() => navigate(`/watch/${video.id}`)}>
                    {video.title}
                  </h3>
                  
                  <div className="history-meta">
                    <span className="channel-name">{video.channel_name}</span>
                    <span className="separator">•</span>
                    <span>{formatDate(item.last_watched_at)}</span>
                  </div>

                  <div className="history-stats">
                    <span>Watched: {formatDuration(item.watch_time)} / {formatDuration(video.duration)}</span>
                    {progress > 0 && (
                      <>
                        <span className="separator">•</span>
                        <span>{progress.toFixed(0)}% complete</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    className="btn-remove"
                    title="Remove from history"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
