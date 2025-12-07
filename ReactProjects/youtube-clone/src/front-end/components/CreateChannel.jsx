import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createChannel, isChannelTagAvailable, supabase } from '../utils/supabase';
import '../../styles/main.css';

export default function CreateChannel({ onChannelCreated, skipable = false }) {
  const navigate = useNavigate();
  const [channelTag, setChannelTag] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
    } else {
      setUser(user);
    }
  };

  const createChannelMutation = useMutation({
    mutationFn: createChannel,
    onSuccess: (channel) => {
      if (onChannelCreated) {
        onChannelCreated(channel);
      } else {
        navigate('/');
      }
    },
    onError: (error) => {
      alert(`Error creating channel: ${error.message}`);
    },
  });

  const checkChannelTagAvailability = async (tag) => {
    if (!tag || tag.length < 3) {
      setAvailabilityMessage('');
      setIsAvailable(null);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const available = await isChannelTagAvailable(tag);
      setIsAvailable(available);
      setAvailabilityMessage(
        available 
          ? '✓ Channel tag is available' 
          : '✗ Channel tag is already taken'
      );
    } catch (error) {
      setAvailabilityMessage('Error checking availability');
      setIsAvailable(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleChannelTagChange = (e) => {
    let value = e.target.value;
    // Allow only alphanumeric, hyphens, and underscores
    value = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setChannelTag(value);
    
    // Debounce availability check
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkChannelTagAvailability(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailabilityMessage('');
      setIsAvailable(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create a channel');
      return;
    }

    if (!isAvailable) {
      alert('Please choose an available channel tag');
      return;
    }

    const channelData = {
      user_id: user.id,
      channel_tag: channelTag.trim(),
      channel_name: channelName.trim(),
      channel_description: channelDescription.trim() || null,
    };

    createChannelMutation.mutate(channelData);
  };

  const handleSkip = () => {
    if (onChannelCreated) {
      onChannelCreated(null);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="create-channel-container">
      <div className="create-channel-card">
        <h2>Create Your Channel</h2>
        <p className="create-channel-subtitle">
          Share your content with the world. You can always create a channel later.
        </p>

        <form onSubmit={handleSubmit} className="create-channel-form">
          <div className="form-group">
            <label htmlFor="channelTag">Channel Handle *</label>
            <div className="channel-name-input-wrapper">
              <span className="channel-name-prefix">@</span>
              <input
                id="channelTag"
                type="text"
                value={channelTag}
                onChange={handleChannelTagChange}
                placeholder="mychannel"
                required
                minLength={3}
                maxLength={100}
                pattern="[a-z0-9_-]+"
                title="Only lowercase letters, numbers, hyphens, and underscores allowed"
              />
            </div>
            {isCheckingAvailability && (
              <span className="availability-message checking">Checking availability...</span>
            )}
            {availabilityMessage && !isCheckingAvailability && (
              <span className={`availability-message ${isAvailable ? 'available' : 'taken'}`}>
                {availabilityMessage}
              </span>
            )}
            <small>3-100 characters. Only lowercase letters, numbers, hyphens, and underscores.</small>
          </div>

          <div className="form-group">
            <label htmlFor="channelName">Channel Name *</label>
            <input
              id="channelName"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="My Awesome Channel"
              required
              maxLength={255}
            />
            <small>This is how your channel name will appear to viewers.</small>
          </div>

          <div className="form-group">
            <label htmlFor="channelDescription">Channel Description</label>
            <textarea
              id="channelDescription"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="Tell viewers what your channel is about..."
              rows={4}
              maxLength={200}
            />
            <small>{channelDescription.length}/200 characters</small>
          </div>

          <div className="form-actions">
            {skipable && (
              <button 
                type="button" 
                className="btn-skip"
                onClick={handleSkip}
                disabled={createChannelMutation.isPending}
              >
                Skip for Now
              </button>
            )}
            <button 
              type="submit" 
              className="btn-create-channel"
              disabled={createChannelMutation.isPending || !isAvailable || !channelTag || !channelName}
            >
              {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
