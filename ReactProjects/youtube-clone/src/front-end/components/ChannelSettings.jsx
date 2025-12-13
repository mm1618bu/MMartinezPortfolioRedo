import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import '../../styles/main.css';

export default function ChannelSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  
  // User and channel data
  const [user, setUser] = useState(null);
  const [channelData, setChannelData] = useState(null);
  
  // General settings
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelEmail, setChannelEmail] = useState('');
  const [channelWebsite, setChannelWebsite] = useState('');
  
  // Privacy settings
  const [defaultVideoPrivacy, setDefaultVideoPrivacy] = useState('public');
  const [showSubscriberCount, setShowSubscriberCount] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowRatings, setAllowRatings] = useState(true);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [subscriptionNotifications, setSubscriptionNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      setUser(currentUser);
      
      // Get channel data
      const { data: channel, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) throw error;
      
      if (channel) {
        setChannelData(channel);
        setChannelName(channel.channel_name || '');
        setChannelDescription(channel.channel_description || '');
        setChannelEmail(channel.contact_email || '');
        setChannelWebsite(channel.website || '');
        
        // Load privacy settings
        setDefaultVideoPrivacy(channel.default_video_privacy || 'public');
        setShowSubscriberCount(channel.show_subscriber_count !== false);
        setAllowComments(channel.allow_comments !== false);
        setAllowRatings(channel.allow_ratings !== false);
        
        // Load notification settings
        setEmailNotifications(channel.email_notifications !== false);
        setCommentNotifications(channel.comment_notifications !== false);
        setSubscriptionNotifications(channel.subscription_notifications !== false);
        setLikeNotifications(channel.like_notifications === true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('❌ Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');
      
      const updates = {
        channel_name: channelName,
        channel_description: channelDescription,
        contact_email: channelEmail,
        website: channelWebsite,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelData.id);
      
      if (error) throw error;
      
      setMessage('✅ General settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');
      
      const updates = {
        default_video_privacy: defaultVideoPrivacy,
        show_subscriber_count: showSubscriberCount,
        allow_comments: allowComments,
        allow_ratings: allowRatings,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelData.id);
      
      if (error) throw error;
      
      setMessage('✅ Privacy settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');
      
      const updates = {
        email_notifications: emailNotifications,
        comment_notifications: commentNotifications,
        subscription_notifications: subscriptionNotifications,
        like_notifications: likeNotifications,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelData.id);
      
      if (error) throw error;
      
      setMessage('✅ Notification settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="channel-settings-loading">
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div className="channel-settings-error">
        <p>You need to create a channel first</p>
        <button onClick={() => navigate('/create-channel')}>
          Create Channel
        </button>
      </div>
    );
  }

  return (
    <div className="channel-settings-container">
      <div className="channel-settings-header">
        <h1>Channel Settings</h1>
        <button 
          className="channel-settings-back-btn"
          onClick={() => navigate(`/channel/${channelData.channel_tag}`)}
        >
          ← Back to Channel
        </button>
      </div>

      {/* Tabs */}
      <div className="channel-settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          ⚙️ General
        </button>
        <button
          className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          🔒 Privacy
        </button>
        <button
          className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`settings-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="settings-form">
          <h2>General Settings</h2>
          
          <div className="settings-field">
            <label htmlFor="channelName">Channel Name</label>
            <input
              id="channelName"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Enter your channel name"
              required
            />
            <small>This is how your channel will appear to viewers</small>
          </div>

          <div className="settings-field">
            <label htmlFor="channelDescription">Channel Description</label>
            <textarea
              id="channelDescription"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="Tell viewers about your channel"
              rows="4"
            />
            <small>Describe what your channel is about</small>
          </div>

          <div className="settings-field">
            <label htmlFor="channelEmail">Contact Email</label>
            <input
              id="channelEmail"
              type="email"
              value={channelEmail}
              onChange={(e) => setChannelEmail(e.target.value)}
              placeholder="contact@example.com"
            />
            <small>For business inquiries (optional)</small>
          </div>

          <div className="settings-field">
            <label htmlFor="channelWebsite">Website</label>
            <input
              id="channelWebsite"
              type="url"
              value={channelWebsite}
              onChange={(e) => setChannelWebsite(e.target.value)}
              placeholder="https://example.com"
            />
            <small>Your website or social media link (optional)</small>
          </div>

          <button type="submit" disabled={saving} className="settings-save-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Privacy Settings */}
      {activeTab === 'privacy' && (
        <form onSubmit={handleSavePrivacy} className="settings-form">
          <h2>Privacy Settings</h2>
          
          <div className="settings-field">
            <label>Default Video Privacy</label>
            <div className="privacy-options">
              <label className="radio-option">
                <input
                  type="radio"
                  value="public"
                  checked={defaultVideoPrivacy === 'public'}
                  onChange={(e) => setDefaultVideoPrivacy(e.target.value)}
                />
                <div>
                  <strong>🌐 Public</strong>
                  <small>Anyone can watch your videos</small>
                </div>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="private"
                  checked={defaultVideoPrivacy === 'private'}
                  onChange={(e) => setDefaultVideoPrivacy(e.target.value)}
                />
                <div>
                  <strong>🔒 Private</strong>
                  <small>Only you can watch your videos</small>
                </div>
              </label>
            </div>
            <small>This will be the default privacy setting for new uploads</small>
          </div>

          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={showSubscriberCount}
                onChange={(e) => setShowSubscriberCount(e.target.checked)}
              />
              <div>
                <strong>Show Subscriber Count</strong>
                <small>Display the number of subscribers on your channel</small>
              </div>
            </label>
          </div>

          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
              />
              <div>
                <strong>Allow Comments</strong>
                <small>Let viewers comment on your videos</small>
              </div>
            </label>
          </div>

          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={allowRatings}
                onChange={(e) => setAllowRatings(e.target.checked)}
              />
              <div>
                <strong>Allow Ratings</strong>
                <small>Let viewers like or dislike your videos</small>
              </div>
            </label>
          </div>

          <button type="submit" disabled={saving} className="settings-save-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="settings-form">
          <h2>Notification Settings</h2>
          
          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <div>
                <strong>Email Notifications</strong>
                <small>Receive email notifications about your channel activity</small>
              </div>
            </label>
          </div>

          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={commentNotifications}
                onChange={(e) => setCommentNotifications(e.target.checked)}
                disabled={!emailNotifications}
              />
              <div>
                <strong>Comment Notifications</strong>
                <small>Get notified when someone comments on your videos</small>
              </div>
            </label>
          </div>

          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={subscriptionNotifications}
                onChange={(e) => setSubscriptionNotifications(e.target.checked)}
                disabled={!emailNotifications}
              />
              <div>
                <strong>Subscription Notifications</strong>
                <small>Get notified when someone subscribes to your channel</small>
              </div>
            </label>
          </div>

          <div className="settings-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={likeNotifications}
                onChange={(e) => setLikeNotifications(e.target.checked)}
                disabled={!emailNotifications}
              />
              <div>
                <strong>Like Notifications</strong>
                <small>Get notified when someone likes your videos</small>
              </div>
            </label>
          </div>

          <button type="submit" disabled={saving} className="settings-save-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
