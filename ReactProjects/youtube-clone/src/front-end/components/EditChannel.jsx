import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateChannel, uploadProfilePicture, uploadBannerImage, supabase } from '../utils/supabase';
import '../../styles/main.css';

export default function EditChannel({ channelData, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    channel_name: '',
    channel_description: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (channelData) {
      setFormData({
        channel_name: channelData.channel_name || '',
        channel_description: channelData.channel_description || ''
      });
    }
  }, [channelData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update channel info
      await updateChannel(channelData.channel_id, {
        channel_name: formData.channel_name,
        channel_description: formData.channel_description
      });

      // Upload profile picture if changed
      if (profilePicture) {
        await uploadProfilePicture(user.id, profilePicture);
      }

      // Upload banner image if changed
      if (bannerImage) {
        await uploadBannerImage(user.id, bannerImage);
      }

      setSuccess('Channel updated successfully!');
      
      // Notify parent component to refresh data
      if (onUpdate) {
        onUpdate();
      }

      // Close modal after a short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);

    } catch (err) {
      console.error('Error updating channel:', err);
      setError(err.message || 'Failed to update channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-channel-overlay" onClick={onClose}>
      <div className="edit-channel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-channel-header">
          <h2>Edit Channel</h2>
          <button className="edit-channel-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-channel-form">
          {/* Channel Name */}
          <div className="edit-channel-field">
            <label htmlFor="channel_name">Channel Name</label>
            <input
              type="text"
              id="channel_name"
              name="channel_name"
              value={formData.channel_name}
              onChange={handleInputChange}
              placeholder="Enter channel name"
              required
              maxLength={50}
            />
          </div>

          {/* Channel Description */}
          <div className="edit-channel-field">
            <label htmlFor="channel_description">Description</label>
            <textarea
              id="channel_description"
              name="channel_description"
              value={formData.channel_description}
              onChange={handleInputChange}
              placeholder="Tell viewers about your channel"
              rows={5}
              maxLength={1000}
            />
            <span className="edit-channel-char-count">
              {formData.channel_description.length}/1000
            </span>
          </div>

          {/* Profile Picture */}
          <div className="edit-channel-field">
            <label htmlFor="profile_picture">Profile Picture</label>
            <div className="edit-channel-image-upload">
              {profilePreview ? (
                <img 
                  src={profilePreview} 
                  alt="Profile preview" 
                  className="edit-channel-preview-avatar"
                />
              ) : channelData?.avatar_url ? (
                <img 
                  src={channelData.avatar_url} 
                  alt="Current profile" 
                  className="edit-channel-preview-avatar"
                />
              ) : (
                <div className="edit-channel-preview-placeholder">
                  No profile picture
                </div>
              )}
              <input
                type="file"
                id="profile_picture"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="edit-channel-file-input"
              />
              <label htmlFor="profile_picture" className="edit-channel-upload-btn">
                Choose Image
              </label>
            </div>
            <p className="edit-channel-hint">Recommended: Square image, at least 98x98px</p>
          </div>

          {/* Banner Image */}
          <div className="edit-channel-field">
            <label htmlFor="banner_image">Banner Image</label>
            <div className="edit-channel-image-upload">
              {bannerPreview ? (
                <img 
                  src={bannerPreview} 
                  alt="Banner preview" 
                  className="edit-channel-preview-banner"
                />
              ) : channelData?.banner_url ? (
                <img 
                  src={channelData.banner_url} 
                  alt="Current banner" 
                  className="edit-channel-preview-banner"
                />
              ) : (
                <div className="edit-channel-preview-placeholder banner">
                  No banner image
                </div>
              )}
              <input
                type="file"
                id="banner_image"
                accept="image/*"
                onChange={handleBannerImageChange}
                className="edit-channel-file-input"
              />
              <label htmlFor="banner_image" className="edit-channel-upload-btn">
                Choose Image
              </label>
            </div>
            <p className="edit-channel-hint">Recommended: 2560x1440px, max 6MB</p>
          </div>

          {/* Error/Success Messages */}
          {error && <div className="edit-channel-error">{error}</div>}
          {success && <div className="edit-channel-success">{success}</div>}

          {/* Form Actions */}
          <div className="edit-channel-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="edit-channel-btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="edit-channel-btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
