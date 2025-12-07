import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPlaylistById, 
  getPlaylistVideos, 
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist 
} from '../utils/supabase';

const PlaylistViewer = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);

  // Fetch playlist metadata
  const { data: playlist, isLoading: playlistLoading, error: playlistError } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => getPlaylistById(playlistId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch playlist videos
  const { data: playlistVideos, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['playlist', playlistId, 'videos'],
    queryFn: () => getPlaylistVideos(playlistId),
    staleTime: 5 * 60 * 1000,
  });

  // Remove video mutation
  const removeVideoMutation = useMutation({
    mutationFn: ({ playlistId, videoId }) => removeVideoFromPlaylist(playlistId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId, 'videos'] });
    },
  });

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: ({ playlistId, updates }) => updatePlaylist(playlistId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsEditing(false);
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      navigate('/playlists');
    },
  });

  const handleRemoveVideo = (videoId) => {
    if (window.confirm('Remove this video from the playlist?')) {
      removeVideoMutation.mutate({ playlistId, videoId });
    }
  };

  const handleEditPlaylist = () => {
    if (playlist) {
      setEditTitle(playlist.title);
      setEditDescription(playlist.description || '');
      setEditIsPublic(playlist.is_public);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    const updates = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      is_public: editIsPublic,
    };
    updatePlaylistMutation.mutate({ playlistId, updates });
  };

  const handleDeletePlaylist = () => {
    if (window.confirm('Are you sure you want to delete this playlist? This cannot be undone.')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  if (playlistLoading || videosLoading) {
    return <div className="playlist-loading">Loading playlist...</div>;
  }

  if (playlistError || videosError) {
    return (
      <div className="playlist-error">
        Error loading playlist: {(playlistError || videosError).message}
      </div>
    );
  }

  if (!playlist) {
    return <div className="playlist-error">Playlist not found</div>;
  }

  return (
    <div className="playlist-viewer">
      <div className="playlist-header">
        <div className="playlist-header-content">
          {isEditing ? (
            <div className="playlist-edit-form">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Playlist title"
                className="edit-title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Playlist description"
                className="edit-description"
                rows={3}
              />
              <label className="edit-public">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                />
                <span>Public</span>
              </label>
              <div className="edit-actions">
                <button onClick={handleSaveEdit} disabled={updatePlaylistMutation.isPending}>
                  {updatePlaylistMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1>{playlist.title}</h1>
              {playlist.description && <p className="playlist-description">{playlist.description}</p>}
              <div className="playlist-metadata">
                <span className="playlist-channel">{playlist.channel_name}</span>
                <span className={`playlist-visibility ${playlist.is_public ? 'public' : 'private'}`}>
                  {playlist.is_public ? '🌐 Public' : '🔒 Private'}
                </span>
                <span className="playlist-stats">
                  {playlist.video_count || 0} videos • {playlist.total_views || 0} views
                </span>
              </div>
              <div className="playlist-actions">
                <button className="btn-edit" onClick={handleEditPlaylist}>
                  Edit Playlist
                </button>
                <button 
                  className="btn-delete" 
                  onClick={handleDeletePlaylist}
                  disabled={deletePlaylistMutation.isPending}
                >
                  {deletePlaylistMutation.isPending ? 'Deleting...' : 'Delete Playlist'}
                </button>
              </div>
            </>
          )}
        </div>
        {playlist.thumbnail_url && !isEditing && (
          <div className="playlist-header-thumbnail">
            <img src={playlist.thumbnail_url} alt={playlist.title} />
          </div>
        )}
      </div>

      <div className="playlist-videos">
        <h2>Videos</h2>
        {!playlistVideos || playlistVideos.length === 0 ? (
          <div className="playlist-empty">
            <p>No videos in this playlist yet.</p>
            <p>Add videos to get started!</p>
          </div>
        ) : (
          <div className="playlist-videos-list">
            {playlistVideos.map((item, index) => (
              <div key={item.id} className="playlist-video-item">
                <div className="video-position">{index + 1}</div>
                <div className="video-thumbnail" onClick={() => handleVideoClick(item.video.id)}>
                  <img src={item.video.thumbnail_url} alt={item.video.title} />
                  <div className="video-duration">{item.video.duration}</div>
                </div>
                <div className="video-info" onClick={() => handleVideoClick(item.video.id)}>
                  <h3>{item.video.title}</h3>
                  <p className="video-channel">{item.video.channel_name}</p>
                  <p className="video-stats">
                    {item.video.views.toLocaleString()} views • {item.video.likes} likes
                  </p>
                </div>
                <button 
                  className="btn-remove"
                  onClick={() => handleRemoveVideo(item.video_id)}
                  disabled={removeVideoMutation.isPending}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistViewer;
