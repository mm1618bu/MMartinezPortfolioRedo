/**
 * NotificationBell Component
 * Displays notification icon with unread count and dropdown panel
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUnreadNotificationCount,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor
} from '../utils/notificationAPI';
import './NotificationBell.css';

export default function NotificationBell({ userId }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadUnreadCount();
      if (showPanel) {
        loadNotifications();
      }
    }
  }, [userId, showPanel, filter]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const channel = subscribeToNotifications(userId, (newNotification) => {
      // Add new notification to the list
      setNotifications(prev => [newNotification, ...prev]);
      // Increment unread count
      setUnreadCount(prev => prev + 1);
      
      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: newNotification.id
        });
      }
    });

    return () => {
      unsubscribeFromNotifications(channel);
    };
  }, [userId]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  const loadUnreadCount = async () => {
    const count = await getUnreadNotificationCount(userId);
    setUnreadCount(count);
  };

  const loadNotifications = async () => {
    setLoading(true);
    const notifs = await getUserNotifications(
      userId,
      20,
      0,
      filter === 'unread'
    );
    setNotifications(notifs);
    setLoading(false);
  };

  const handleBellClick = () => {
    setShowPanel(!showPanel);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationRead(notification.id, userId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
    }

    // Navigate to action URL
    if (notification.action_url) {
      navigate(notification.action_url);
      setShowPanel(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId);
    setUnreadCount(0);
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId, userId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (!notifications.find(n => n.id === notificationId)?.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return (
    <div className="notification-bell-container" ref={panelRef}>
      {/* Bell Icon */}
      <button
        className="notification-bell-button"
        onClick={handleBellClick}
        title="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="notification-panel">
          {/* Header */}
          <div className="notification-panel-header">
            <h3>Notifications</h3>
            <div className="notification-panel-actions">
              <button
                className="filter-btn"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              >
                {filter === 'all' ? 'Unread' : 'All'}
              </button>
              {unreadCount > 0 && (
                <button
                  className="mark-read-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  ✓ All
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">🔔</span>
                <p>No notifications yet</p>
                <small>
                  {filter === 'unread' 
                    ? "You're all caught up!" 
                    : "When you get notifications, they'll show up here"
                  }
                </small>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="unread-dot"></div>
                    )}

                    {/* Icon */}
                    <div
                      className="notification-icon"
                      style={{ backgroundColor: getNotificationColor(notification.type) }}
                    >
                      {notification.actor_avatar_url ? (
                        <img
                          src={notification.actor_avatar_url}
                          alt=""
                          className="notification-avatar"
                        />
                      ) : (
                        <span>{getNotificationIcon(notification.type)}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-title">
                          {notification.title}
                        </span>
                        <button
                          className="notification-delete"
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          title="Delete notification"
                        >
                          ×
                        </button>
                      </div>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <div className="notification-meta">
                        {notification.actor_channel_name && (
                          <span className="notification-actor">
                            {notification.actor_channel_name}
                          </span>
                        )}
                        <span className="notification-time">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    {notification.video_thumbnail_url && (
                      <div className="notification-thumbnail">
                        <img
                          src={notification.video_thumbnail_url}
                          alt=""
                        />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-panel-footer">
              <button
                className="view-all-btn"
                onClick={() => {
                  navigate('/notifications');
                  setShowPanel(false);
                }}
              >
                View All Notifications
              </button>
            </div>
          )}

          {/* Browser notification prompt */}
          {'Notification' in window && Notification.permission === 'default' && (
            <div className="notification-permission-prompt">
              <button onClick={requestNotificationPermission}>
                🔔 Enable Browser Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
