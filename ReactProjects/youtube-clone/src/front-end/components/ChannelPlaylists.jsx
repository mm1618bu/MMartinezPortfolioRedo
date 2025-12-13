import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPlaylistsByUserId } from '../utils/supabase';
import '../../styles/main.css';

export default function ChannelPlaylists({ userId }) {
  const navigate = useNavigate();
  const [filterPublic, setFilterPublic] = useState('all'); // 'all', 'public', 'private'

  // Fetch playlists for this user
  const { data: playlists, isLoading, error } = useQuery({
    queryKey: ['playlists', 'user', userId],
    queryFn: () => getPlaylistsByUserId(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!userId) {
    return (
      <div className="channel-playlists-empty">
        <p>User information not available</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="channel-playlists-loading">
        <p>Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-playlists-error">
        <p>Error loading playlists: {error.message}</p>
      </div>
    );
  }

  // Filter playlists by visibility
  const filteredPlaylists = playlists?.filter(playlist => {
    if (filterPublic === 'all') return true;
    if (filterPublic === 'public') return playlist.is_public;
    if (filterPublic === 'private') return !playlist.is_public;
    return true;
  }) || [];

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  return (
    <div className="channel-playlists-container">
      {/* Filter Buttons */}
      <div className="channel-playlists-filters">
        <button 
          className={`channel-playlists-filter-btn ${filterPublic === 'all' ? 'active' : ''}`}
          onClick={() => setFilterPublic('all')}
        >
          All ({playlists?.length || 0})
        </button>
        <button 
          className={`channel-playlists-filter-btn ${filterPublic === 'public' ? 'active' : ''}`}
          onClick={() => setFilterPublic('public')}
        >
          Public ({playlists?.filter(p => p.is_public).length || 0})
        </button>
        <button 
          className={`channel-playlists-filter-btn ${filterPublic === 'private' ? 'active' : ''}`}
          onClick={() => setFilterPublic('private')}
        >
          Private ({playlists?.filter(p => !p.is_public).length || 0})
        </button>
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <div className="channel-playlists-empty">
          <p>
            {filterPublic === 'all' 
              ? 'No playlists yet. Create your first playlist!' 
              : `No ${filterPublic} playlists found.`}
          </p>
        </div>
      ) : (
        <div className="channel-playlists-grid">
          {filteredPlaylists.map(playlist => (
            <div 
              key={playlist.id} 
              className="channel-playlist-card"
              onClick={() => handlePlaylistClick(playlist.id)}
            >
              <div className="channel-playlist-thumbnail">
                {playlist.thumbnail_url ? (
                  <img src={playlist.thumbnail_url} alt={playlist.name} />
                ) : (
                  <div className="channel-playlist-placeholder">
                    <span className="playlist-icon">📁</span>
                  </div>
                )}
                <div className="channel-playlist-overlay">
                  <span className="playlist-icon-overlay">▶</span>
                  <span className="playlist-play-text">Play all</span>
                </div>
              </div>

              <div className="channel-playlist-info">
                <h3 className="channel-playlist-title">{playlist.name}</h3>
                
                {playlist.description && (
                  <p className="channel-playlist-description">
                    {playlist.description}
                  </p>
                )}

                <div className="channel-playlist-meta">
                  <span className="channel-playlist-visibility">
                    {playlist.is_public ? '🌐 Public' : '🔒 Private'}
                  </span>
                  {playlist.video_count !== undefined && (
                    <span className="channel-playlist-count">
                      {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'}
                    </span>
                  )}
                </div>

                <div className="channel-playlist-date">
                  Created {new Date(playlist.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
