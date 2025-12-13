import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPlaylistsByUserId, 
  addVideoToPlaylist, 
  removeVideoFromPlaylist,
  isVideoInPlaylist,
  addToWatchLater,
  removeFromWatchLater,
  isInWatchLater,
  createPlaylist,
  supabase
} from '../utils/supabase';
import '../../styles/main.css';

export default function SaveToPlaylist({ videoId, onClose }) {
  const queryClient = useQueryClient();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistPrivate, setNewPlaylistPrivate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Fetch user's playlists
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists', 'user', currentUserId],
    queryFn: () => getPlaylistsByUserId(currentUserId),
    enabled: !!currentUserId,
  });

  // Check Watch Later status
  const { data: inWatchLater = false } = useQuery({
    queryKey: ['watchLater', currentUserId, videoId],
    queryFn: () => isInWatchLater(currentUserId, videoId),
    enabled: !!currentUserId && !!videoId,
  });

  // Check which playlists contain this video
  const { data: playlistStatuses = {} } = useQuery({
    queryKey: ['playlistStatuses', videoId, currentUserId],
    queryFn: async () => {
      const statuses = {};
      for (const playlist of playlists) {
        statuses[playlist.id] = await isVideoInPlaylist(playlist.id, videoId);
      }
      return statuses;
    },
    enabled: !!currentUserId && !!videoId && playlists.length > 0,
  });

  // Watch Later mutation
  const watchLaterMutation = useMutation({
    mutationFn: () => {
      if (inWatchLater) {
        return removeFromWatchLater(currentUserId, videoId);
      } else {
        return addToWatchLater(currentUserId, videoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchLater', currentUserId, videoId]);
    },
  });

  // Toggle video in playlist mutation
  const togglePlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, isInPlaylist }) => {
      if (isInPlaylist) {
        await removeVideoFromPlaylist(playlistId, videoId);
      } else {
        await addVideoToPlaylist(playlistId, videoId, currentUserId);
      }
      return { playlistId, isInPlaylist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['playlistStatuses', videoId, currentUserId]);
    },
  });

  // Create new playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlistData) => {
      const newPlaylist = await createPlaylist(playlistData);
      await addVideoToPlaylist(newPlaylist.id, videoId, currentUserId);
      return newPlaylist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['playlists', 'user', currentUserId]);
      queryClient.invalidateQueries(['playlistStatuses', videoId, currentUserId]);
      setShowCreateNew(false);
      setNewPlaylistName('');
    },
  });

  const handleWatchLater = () => {
    watchLaterMutation.mutate();
  };

  const handleTogglePlaylist = (playlistId) => {
    const isInPlaylist = playlistStatuses[playlistId] || false;
    setLoadingStates({ ...loadingStates, [playlistId]: true });
    togglePlaylistMutation.mutate(
      { playlistId, isInPlaylist },
      {
        onSettled: () => {
          setLoadingStates({ ...loadingStates, [playlistId]: false });
        },
      }
    );
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    createPlaylistMutation.mutate({
      user_id: currentUserId,
      name: newPlaylistName.trim(),
      description: '',
      is_public: !newPlaylistPrivate,
      channel_name: user?.user_metadata?.display_name || 'Default Channel'
    });
  };

  if (!currentUserId) {
    return (
      <div className="save-to-playlist-overlay" onClick={onClose}>
        <div className="save-to-playlist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="save-to-playlist-header">
            <h3>Save to...</h3>
            <button className="save-to-playlist-close" onClick={onClose}>×</button>
          </div>
          <div className="save-to-playlist-body">
            <p className="save-to-playlist-login-message">Please sign in to save videos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="save-to-playlist-overlay" onClick={onClose}>
      <div className="save-to-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="save-to-playlist-header">
          <h3>Save to...</h3>
          <button className="save-to-playlist-close" onClick={onClose}>×</button>
        </div>

        <div className="save-to-playlist-body">
          {/* Watch Later */}
          <div 
            className="save-to-playlist-item"
            onClick={handleWatchLater}
          >
            <input
              type="checkbox"
              checked={inWatchLater}
              onChange={() => {}}
              disabled={watchLaterMutation.isPending}
            />
            <span className="save-to-playlist-icon">🕒</span>
            <span className="save-to-playlist-name">Watch Later</span>
          </div>

          {/* Divider */}
          <div className="save-to-playlist-divider"></div>

          {/* User's Playlists */}
          {isLoading ? (
            <div className="save-to-playlist-loading">Loading playlists...</div>
          ) : playlists.length === 0 ? (
            <div className="save-to-playlist-empty">No playlists yet</div>
          ) : (
            <div className="save-to-playlist-list">
              {playlists
                .filter(p => p.name !== 'Watch Later')
                .map(playlist => (
                  <div
                    key={playlist.id}
                    className="save-to-playlist-item"
                    onClick={() => handleTogglePlaylist(playlist.id)}
                  >
                    <input
                      type="checkbox"
                      checked={playlistStatuses[playlist.id] || false}
                      onChange={() => {}}
                      disabled={loadingStates[playlist.id]}
                    />
                    <span className="save-to-playlist-icon">
                      {playlist.is_public ? '🌐' : '🔒'}
                    </span>
                    <span className="save-to-playlist-name">{playlist.name}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Create New Playlist */}
          {!showCreateNew ? (
            <button
              className="save-to-playlist-create-btn"
              onClick={() => setShowCreateNew(true)}
            >
              + Create new playlist
            </button>
          ) : (
            <form onSubmit={handleCreatePlaylist} className="save-to-playlist-create-form">
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                maxLength={50}
              />
              <div className="save-to-playlist-privacy">
                <label>
                  <input
                    type="checkbox"
                    checked={newPlaylistPrivate}
                    onChange={(e) => setNewPlaylistPrivate(e.target.checked)}
                  />
                  Private
                </label>
              </div>
              <div className="save-to-playlist-create-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateNew(false);
                    setNewPlaylistName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                >
                  {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
