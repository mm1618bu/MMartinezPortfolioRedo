/**
 * Notification API Utilities
 * Handles all notification-related operations
 */

import { supabase } from './supabase';

/**
 * Get unread notification count for current user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', {
        p_user_id: userId
      });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Get user's notifications with pagination
 */
export const getUserNotifications = async (userId, limit = 20, offset = 0, unreadOnly = false) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_notifications', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_unread_only: unreadOnly
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId, userId) => {
  try {
    const { data, error } = await supabase
      .rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: userId
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('mark_all_notifications_read', {
        p_user_id: userId
      });

    if (error) throw error;
    return data; // Returns count of notifications marked as read
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification (archive it)
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const { data, error } = await supabase
      .rpc('delete_notification', {
        p_notification_id: notificationId,
        p_user_id: userId
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Create a new notification
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  videoId = null,
  commentId = null,
  channelId = null,
  actorUserId = null,
  actionUrl = null,
  metadata = {}
}) => {
  try {
    const { data, error } = await supabase
      .rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_video_id: videoId,
        p_comment_id: commentId,
        p_channel_id: channelId,
        p_actor_user_id: actorUserId,
        p_action_url: actionUrl,
        p_metadata: metadata
      });

    if (error) throw error;
    return data; // Returns notification ID
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get user's notification preferences
 */
export const getNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // If no preferences exist, return defaults
    if (!data) {
      return {
        comment_notifications: true,
        reply_notifications: true,
        like_notifications: false,
        subscription_notifications: true,
        mention_notifications: true,
        upload_notifications: true,
        email_enabled: true,
        email_comments: true,
        email_subscriptions: true,
        email_digest: false,
        push_enabled: false,
        realtime_enabled: true,
        digest_frequency: 'none'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
};

/**
 * Update user's notification preferences
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notifications for a user
 */
export const subscribeToNotifications = (userId, callback) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('New notification received:', payload);
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from real-time notifications
 */
export const unsubscribeFromNotifications = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

/**
 * Helper function to format notification time
 */
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const notifTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - notifTime) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return notifTime.toLocaleDateString();
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
  const icons = {
    comment: '💬',
    reply: '↩️',
    like: '👍',
    subscription: '🔔',
    mention: '@',
    upload: '📹',
    dislike: '👎'
  };
  
  return icons[type] || '🔔';
};

/**
 * Get notification color based on type
 */
export const getNotificationColor = (type) => {
  const colors = {
    comment: '#4A90E2',
    reply: '#50C878',
    like: '#FF6B6B',
    subscription: '#9B59B6',
    mention: '#F39C12',
    upload: '#667EEA',
    dislike: '#95A5A6'
  };
  
  return colors[type] || '#667EEA';
};

/**
 * Helper: Create notification for new comment
 */
export const notifyNewComment = async (videoOwnerId, actorUserId, videoId, videoTitle, commentText) => {
  return createNotification({
    userId: videoOwnerId,
    type: 'comment',
    title: 'New comment on your video',
    message: `Someone commented on "${videoTitle}": ${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}`,
    videoId,
    actorUserId,
    actionUrl: `/watch/${videoId}`,
    metadata: { commentText }
  });
};

/**
 * Helper: Create notification for new reply
 */
export const notifyNewReply = async (commentOwnerId, actorUserId, videoId, commentId, replyText) => {
  return createNotification({
    userId: commentOwnerId,
    type: 'reply',
    title: 'New reply to your comment',
    message: `Someone replied: ${replyText.substring(0, 100)}${replyText.length > 100 ? '...' : ''}`,
    videoId,
    commentId,
    actorUserId,
    actionUrl: `/watch/${videoId}`,
    metadata: { replyText }
  });
};

/**
 * Helper: Create notification for new like
 */
export const notifyNewLike = async (videoOwnerId, actorUserId, videoId, videoTitle) => {
  return createNotification({
    userId: videoOwnerId,
    type: 'like',
    title: 'Someone liked your video',
    message: `Your video "${videoTitle}" received a new like!`,
    videoId,
    actorUserId,
    actionUrl: `/watch/${videoId}`,
    metadata: {}
  });
};

/**
 * Helper: Create notification for new subscription
 */
export const notifyNewSubscription = async (channelOwnerId, actorUserId, channelId) => {
  return createNotification({
    userId: channelOwnerId,
    type: 'subscription',
    title: 'New subscriber!',
    message: 'Someone subscribed to your channel',
    channelId,
    actorUserId,
    actionUrl: `/channel/${channelId}`,
    metadata: {}
  });
};

/**
 * Helper: Create notification for new upload from subscribed channel
 */
export const notifyNewUpload = async (subscriberId, channelOwnerId, videoId, videoTitle, channelName) => {
  return createNotification({
    userId: subscriberId,
    type: 'upload',
    title: `${channelName} uploaded a new video`,
    message: `Check out their latest video: "${videoTitle}"`,
    videoId,
    actorUserId: channelOwnerId,
    actionUrl: `/watch/${videoId}`,
    metadata: { channelName, videoTitle }
  });
};

/**
 * Helper: Create notification for channel mention
 */
export const notifyChannelMention = async (channelOwnerId, actorUserId, videoId, commentText, channelTag) => {
  return createNotification({
    userId: channelOwnerId,
    type: 'mention',
    title: 'You were mentioned in a comment',
    message: `@${channelTag} was mentioned: ${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}`,
    videoId,
    actorUserId,
    actionUrl: `/watch/${videoId}`,
    metadata: { channelTag, commentText }
  });
};
