import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlaylistCard = ({ playlist }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  return (
    <div className="playlist-card" onClick={handleClick}>
      <div className="playlist-thumbnail">
        <img 
          src={playlist.thumbnail_url || 'https://via.placeholder.com/320x180?text=No+Thumbnail'} 
          alt={playlist.title}
        />
        <div className="playlist-video-count">
          <span className="playlist-icon">📋</span>
          <span>{playlist.video_count || 0} videos</span>
        </div>
      </div>
      <div className="playlist-info">
        <h3 className="playlist-title">{playlist.title}</h3>
        <p className="playlist-channel">{playlist.channel_name}</p>
        {playlist.description && (
          <p className="playlist-description">{playlist.description}</p>
        )}
        <div className="playlist-meta">
          <span className={`playlist-visibility ${playlist.is_public ? 'public' : 'private'}`}>
            {playlist.is_public ? '🌐 Public' : '🔒 Private'}
          </span>
          {playlist.total_views > 0 && (
            <span className="playlist-views">{playlist.total_views.toLocaleString()} views</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
