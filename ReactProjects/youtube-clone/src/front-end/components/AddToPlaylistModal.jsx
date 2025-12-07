import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllPlaylists, addVideoToPlaylist, createPlaylist } from '../utils/supabase';

const AddToPlaylistModal = ({ videoId, onClose }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistIsPublic, setNewPlaylistIsPublic] = useState(true);
  const [channelName, setChannelName] = useState('DefaultChannel');
  const queryClient = useQueryClient();

  // Fetch all playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: getAllPlaylists,
    staleTime: 5 * 60 * 1000,
  });

  // Add video to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, videoId }) => addVideoToPlaylist(playlistId, videoId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId, 'videos'] });
      alert('Video added to playlist!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: createPlaylist,
    onSuccess: (newPlaylist) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      // Add video to the newly created playlist
      addToPlaylistMutation.mutate({ playlistId: newPlaylist.id, videoId });
      setShowCreateForm(false);
      setNewPlaylistTitle('');
    },
    onError: (error) => {
      alert(`Error creating playlist: ${error.message}`);
    },
  });

  const handleAddToPlaylist = (playlistId) => {
    addToPlaylistMutation.mutate({ playlistId, videoId });
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) {
      alert('Please enter a playlist title');
      return;
    }

    const playlistData = {
      title: newPlaylistTitle.trim(),
      description: '',
      is_public: newPlaylistIsPublic,
      channel_name: channelName,
      video_count: 0,
      total_views: 0,
    };

    createPlaylistMutation.mutate(playlistData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-to-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Playlist</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading">Loading playlists...</div>
          ) : (
            <>
              {!showCreateForm ? (
                <>
                  <div className="playlist-list">
                    {playlists && playlists.length > 0 ? (
                      playlists.map((playlist) => (
                        <div key={playlist.id} className="playlist-option">
                          <div className="playlist-option-info">
                            <span className="playlist-option-title">{playlist.title}</span>
                            <span className="playlist-option-meta">
                              {playlist.video_count || 0} videos • {playlist.is_public ? '🌐 Public' : '🔒 Private'}
                            </span>
                          </div>
                          <button
                            className="btn-add-to-playlist"
                            onClick={() => handleAddToPlaylist(playlist.id)}
                            disabled={addToPlaylistMutation.isPending}
                          >
                            Add
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="no-playlists">
                        <p>No playlists yet. Create one to get started!</p>
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn-create-new-playlist"
                    onClick={() => setShowCreateForm(true)}
                  >
                    + Create New Playlist
                  </button>
                </>
              ) : (
                <form onSubmit={handleCreatePlaylist} className="create-playlist-quick-form">
                  <div className="form-group">
                    <label htmlFor="playlist-title">Playlist Title</label>
                    <input
                      id="playlist-title"
                      type="text"
                      value={newPlaylistTitle}
                      onChange={(e) => setNewPlaylistTitle(e.target.value)}
                      placeholder="Enter playlist title"
                      maxLength={100}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="channel-name">Channel Name</label>
                    <input
                      id="channel-name"
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Enter channel name"
                      maxLength={50}
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={newPlaylistIsPublic}
                        onChange={(e) => setNewPlaylistIsPublic(e.target.checked)}
                      />
                      <span>Make this playlist public</span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => setShowCreateForm(false)}
                      disabled={createPlaylistMutation.isPending}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn-create"
                      disabled={createPlaylistMutation.isPending}
                    >
                      {createPlaylistMutation.isPending ? 'Creating...' : 'Create & Add'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
