/**
 * NotificationsPage Component
 * Full page view of all notifications with filtering and management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor
} from '../utils/notificationAPI';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'comments', 'likes', 'subscriptions'
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const navigate = useNavigate();

  // Load user and notifications
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadPreferences();
    }
  }, [currentUser, filter]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
  };

  const loadNotifications = async () => {
    setLoading(true);
    const notifs = await getUserNotifications(
      currentUser.id,
      100,
      0,
      filter === 'unread'
    );
    
    // Apply additional filtering
    let filtered = notifs;
    if (filter === 'comments') {
      filtered = notifs.filter(n => n.type === 'comment' || n.type === 'reply');
    } else if (filter === 'likes') {
      filtered = notifs.filter(n => n.type === 'like');
    } else if (filter === 'subscriptions') {
      filtered = notifs.filter(n => n.type === 'subscription' || n.type === 'upload');
    }
    
    setNotifications(filtered);
    setLoading(false);
  };

  const loadPreferences = async () => {
    const prefs = await getNotificationPreferences(currentUser.id);
    setPreferences(prefs);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationRead(notification.id, currentUser.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
    }

    // Navigate
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(currentUser.id);
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId, currentUser.id);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handlePreferenceChange = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    await updateNotificationPreferences(currentUser.id, { [key]: value });
  };

  if (!currentUser) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header">
          <div className="header-left">
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-count-badge">{unreadCount} unread</span>
            )}
          </div>
          <div className="header-actions">
            <button
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️ Settings
            </button>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                ✓ Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && preferences && (
          <div className="settings-panel">
            <h3>Notification Preferences</h3>
            <div className="settings-grid">
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={preferences.comment_notifications}
                  onChange={(e) => handlePreferenceChange('comment_notifications', e.target.checked)}
                />
                <div className="setting-info">
                  <span className="setting-name">Comments</span>
                  <span className="setting-desc">Get notified when someone comments on your videos</span>
                </div>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={preferences.reply_notifications}
                  onChange={(e) => handlePreferenceChange('reply_notifications', e.target.checked)}
                />
                <div className="setting-info">
                  <span className="setting-name">Replies</span>
                  <span className="setting-desc">Get notified when someone replies to your comments</span>
                </div>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={preferences.like_notifications}
                  onChange={(e) => handlePreferenceChange('like_notifications', e.target.checked)}
                />
                <div className="setting-info">
                  <span className="setting-name">Likes</span>
                  <span className="setting-desc">Get notified when someone likes your videos</span>
                </div>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={preferences.subscription_notifications}
                  onChange={(e) => handlePreferenceChange('subscription_notifications', e.target.checked)}
                />
                <div className="setting-info">
                  <span className="setting-name">Subscriptions</span>
                  <span className="setting-desc">Get notified about new subscribers</span>
                </div>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={preferences.upload_notifications}
                  onChange={(e) => handlePreferenceChange('upload_notifications', e.target.checked)}
                />
                <div className="setting-info">
                  <span className="setting-name">Uploads</span>
                  <span className="setting-desc">Get notified when channels you subscribe to upload</span>
                </div>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={preferences.mention_notifications}
                  onChange={(e) => handlePreferenceChange('mention_notifications', e.target.checked)}
                />
                <div className="setting-info">
                  <span className="setting-name">Mentions</span>
                  <span className="setting-desc">Get notified when someone mentions you</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button
            className={`filter-tab ${filter === 'comments' ? 'active' : ''}`}
            onClick={() => setFilter('comments')}
          >
            💬 Comments
          </button>
          <button
            className={`filter-tab ${filter === 'likes' ? 'active' : ''}`}
            onClick={() => setFilter('likes')}
          >
            👍 Likes
          </button>
          <button
            className={`filter-tab ${filter === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setFilter('subscriptions')}
          >
            🔔 Subscriptions
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔔</span>
              <h2>No notifications</h2>
              <p>
                {filter === 'unread'
                  ? "You're all caught up!"
                  : "When you get notifications, they'll show up here"}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Unread indicator */}
                  {!notification.is_read && <div className="unread-indicator"></div>}

                  {/* Icon */}
                  <div
                    className="notification-icon-large"
                    style={{ backgroundColor: getNotificationColor(notification.type) }}
                  >
                    {notification.actor_avatar_url ? (
                      <img src={notification.actor_avatar_url} alt="" />
                    ) : (
                      <span>{getNotificationIcon(notification.type)}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="notification-body">
                    <div className="notification-top">
                      <h3>{notification.title}</h3>
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                      >
                        ×
                      </button>
                    </div>
                    <p>{notification.message}</p>
                    <div className="notification-footer">
                      {notification.actor_channel_name && (
                        <span className="channel-name">{notification.actor_channel_name}</span>
                      )}
                      <span className="time">{formatNotificationTime(notification.created_at)}</span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {notification.video_thumbnail_url && (
                    <div className="notification-thumb">
                      <img src={notification.video_thumbnail_url} alt="" />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
