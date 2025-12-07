import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllPlaylists, getPlaylistsByChannel } from '../utils/supabase';
import PlaylistCard from './PlaylistCard';

const PlaylistGrid = ({ channelName = null }) => {
  const [filterPublic, setFilterPublic] = useState('all'); // 'all', 'public', 'private'

  // Fetch playlists based on whether we're filtering by channel
  const { data: playlists, isLoading, error } = useQuery({
    queryKey: channelName ? ['playlists', 'channel', channelName] : ['playlists'],
    queryFn: () => channelName ? getPlaylistsByChannel(channelName) : getAllPlaylists(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <div className="playlist-loading">Loading playlists...</div>;
  }

  if (error) {
    return <div className="playlist-error">Error loading playlists: {error.message}</div>;
  }

  // Filter playlists by visibility
  const filteredPlaylists = playlists?.filter(playlist => {
    if (filterPublic === 'all') return true;
    if (filterPublic === 'public') return playlist.is_public;
    if (filterPublic === 'private') return !playlist.is_public;
    return true;
  }) || [];

  return (
    <div className="playlist-grid-container">
      <div className="playlist-grid-header">
        <h2>{channelName ? `${channelName}'s Playlists` : 'All Playlists'}</h2>
        <div className="playlist-filters">
          <button 
            className={`filter-btn ${filterPublic === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPublic('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filterPublic === 'public' ? 'active' : ''}`}
            onClick={() => setFilterPublic('public')}
          >
            Public
          </button>
          <button 
            className={`filter-btn ${filterPublic === 'private' ? 'active' : ''}`}
            onClick={() => setFilterPublic('private')}
          >
            Private
          </button>
        </div>
      </div>

      {filteredPlaylists.length === 0 ? (
        <div className="playlist-empty">
          <p>No playlists found.</p>
        </div>
      ) : (
        <div className="playlist-grid">
          {filteredPlaylists.map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistGrid;
