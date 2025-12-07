import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPlaylist } from '../utils/supabase';

const CreatePlaylist = ({ channelName }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createPlaylistMutation = useMutation({
    mutationFn: createPlaylist,
    onSuccess: (newPlaylist) => {
      // Invalidate playlist queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'channel', channelName] });
      
      // Navigate to the new playlist
      navigate(`/playlist/${newPlaylist.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a playlist title');
      return;
    }

    if (!channelName) {
      alert('Channel name is required');
      return;
    }

    const playlistData = {
      title: title.trim(),
      description: description.trim(),
      is_public: isPublic,
      channel_name: channelName,
      thumbnail_url: thumbnailUrl.trim() || null,
      video_count: 0,
      total_views: 0,
    };

    createPlaylistMutation.mutate(playlistData);
  };

  return (
    <div className="create-playlist-container">
      <h2>Create New Playlist</h2>
      
      <form onSubmit={handleSubmit} className="create-playlist-form">
        <div className="form-group">
          <label htmlFor="title">Playlist Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter playlist title"
            maxLength={100}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter playlist description"
            rows={4}
            maxLength={500}
          />
        </div>

        <div className="form-group">
          <label htmlFor="thumbnailUrl">Thumbnail URL (optional)</label>
          <input
            type="url"
            id="thumbnailUrl"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/thumbnail.jpg"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span>Make this playlist public</span>
          </label>
          <p className="form-hint">
            {isPublic 
              ? '🌐 Everyone can see this playlist' 
              : '🔒 Only you can see this playlist'}
          </p>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={() => navigate(-1)}
            disabled={createPlaylistMutation.isPending}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-create"
            disabled={createPlaylistMutation.isPending}
          >
            {createPlaylistMutation.isPending ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>

        {createPlaylistMutation.isError && (
          <div className="form-error">
            Error: {createPlaylistMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePlaylist;
