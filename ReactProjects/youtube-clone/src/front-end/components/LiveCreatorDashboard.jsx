import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  getChannelDashboardStats,
  getFlaggedCommentsForChannel,
  getFlaggedVideosForChannel,
  updateCommentFlagStatus,
  updateVideoFlagStatus,
  deleteComment
} from '../utils/supabase';
import '../../styles/main.css';

export default function LiveCreatorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [userChannel, setUserChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [liveViewers, setLiveViewers] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const statsSubscription = useRef(null);
  const commentsSubscription = useRef(null);
  const videosSubscription = useRef(null);

  // Get current user and their channel
  useEffect(() => {
    const fetchUserAndChannel = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }
        setCurrentUser(user);

        // Get user's channel
        const { data: channel } = await supabase
          .from('channels')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!channel) {
          navigate('/channel/create');
          return;
        }

        setUserChannel(channel);
      } catch (error) {
        console.error('Error fetching user/channel:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndChannel();
  }, [navigate]);

  // Query dashboard stats with auto-refresh
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats', userChannel?.channel_id],
    queryFn: () => getChannelDashboardStats(userChannel.channel_id),
    enabled: !!userChannel?.channel_id,
    staleTime: 10000, // 10 seconds for live dashboard
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Setup real-time subscriptions for live updates
  useEffect(() => {
    if (!userChannel?.channel_id) return;

    // Subscribe to video views/likes updates
    const setupVideoSubscription = () => {
      if (videosSubscription.current) {
        supabase.removeChannel(videosSubscription.current);
      }

      videosSubscription.current = supabase
        .channel(`channel_videos_${userChannel.channel_id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'videos',
            filter: `channel_id=eq.${userChannel.channel_id}`
          },
          (payload) => {
            // Refresh stats when videos change
            queryClient.invalidateQueries(['dashboardStats']);
            
            // Add to activity feed
            if (payload.eventType === 'UPDATE') {
              const activity = {
                id: Date.now(),
                type: 'video_update',
                message: `Video "${payload.new.title}" was updated`,
                timestamp: new Date().toISOString()
              };
              setRecentActivity(prev => [activity, ...prev].slice(0, 10));
            } else if (payload.eventType === 'INSERT') {
              const activity = {
                id: Date.now(),
                type: 'new_video',
                message: `New video uploaded: "${payload.new.title}"`,
                timestamp: new Date().toISOString()
              };
              setRecentActivity(prev => [activity, ...prev].slice(0, 10));
            }
          }
        )
        .subscribe();
    };

    // Subscribe to new comments
    const setupCommentsSubscription = async () => {
      if (commentsSubscription.current) {
        supabase.removeChannel(commentsSubscription.current);
      }

      // Get video IDs for this channel
      const { data: videos } = await supabase
        .from('videos')
        .select('id')
        .eq('channel_id', userChannel.channel_id);

      const videoIds = videos?.map(v => v.id) || [];

      if (videoIds.length === 0) return;

      commentsSubscription.current = supabase
        .channel(`channel_comments_${userChannel.channel_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments'
          },
          (payload) => {
            if (videoIds.includes(payload.new.video_id)) {
              queryClient.invalidateQueries(['dashboardStats']);
              
              const activity = {
                id: Date.now(),
                type: 'new_comment',
                message: `New comment from ${payload.new.user_name}`,
                timestamp: new Date().toISOString()
              };
              setRecentActivity(prev => [activity, ...prev].slice(0, 10));
            }
          }
        )
        .subscribe();
    };

    // Subscribe to subscriber count changes
    const setupChannelSubscription = () => {
      if (statsSubscription.current) {
        supabase.removeChannel(statsSubscription.current);
      }

      statsSubscription.current = supabase
        .channel(`channel_updates_${userChannel.channel_id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'channels',
            filter: `channel_id=eq.${userChannel.channel_id}`
          },
          (payload) => {
            setUserChannel(payload.new);
            
            const activity = {
              id: Date.now(),
              type: 'channel_update',
              message: `Channel subscriber count: ${payload.new.subscriber_count || 0}`,
              timestamp: new Date().toISOString()
            };
            setRecentActivity(prev => [activity, ...prev].slice(0, 10));
          }
        )
        .subscribe();
    };

    setupVideoSubscription();
    setupCommentsSubscription();
    setupChannelSubscription();

    // Cleanup on unmount
    return () => {
      if (videosSubscription.current) {
        supabase.removeChannel(videosSubscription.current);
      }
      if (commentsSubscription.current) {
        supabase.removeChannel(commentsSubscription.current);
      }
      if (statsSubscription.current) {
        supabase.removeChannel(statsSubscription.current);
      }
    };
  }, [userChannel?.channel_id, queryClient]);

  // Simulate live viewers (in production, this would come from real analytics)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // Random change -2 to +2
        return Math.max(0, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Query flagged comments with refresh
  const { data: flaggedComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['flaggedComments', userChannel?.channel_id],
    queryFn: () => getFlaggedCommentsForChannel(userChannel.channel_id),
    enabled: !!userChannel?.channel_id && activeTab === 'comments',
    staleTime: 10000,
    refetchInterval: 15000, // Check every 15 seconds
  });

  // Query flagged videos with refresh
  const { data: flaggedVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['flaggedVideos', userChannel?.channel_id],
    queryFn: () => getFlaggedVideosForChannel(userChannel.channel_id),
    enabled: !!userChannel?.channel_id && activeTab === 'videos',
    staleTime: 10000,
    refetchInterval: 15000,
  });

  // Mutation to update comment flag status
  const updateCommentFlagMutation = useMutation({
    mutationFn: ({ flagId, status }) => 
      updateCommentFlagStatus(flagId, status, currentUser?.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flaggedComments']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
  });

  // Mutation to update video flag status
  const updateVideoFlagMutation = useMutation({
    mutationFn: ({ flagId, status }) => 
      updateVideoFlagStatus(flagId, status, currentUser?.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flaggedVideos']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
  });

  // Mutation to delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['flaggedComments']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
  });

  const handleDismissCommentFlag = (flagId) => {
    updateCommentFlagMutation.mutate({ flagId, status: 'dismissed' });
  };

  const handleRemoveComment = async (flag) => {
    if (window.confirm('Are you sure you want to remove this comment? This action cannot be undone.')) {
      try {
        await deleteCommentMutation.mutateAsync(flag.comment_id);
        await updateCommentFlagMutation.mutateAsync({ flagId: flag.id, status: 'removed' });
      } catch (error) {
        console.error('Error removing comment:', error);
        alert('Failed to remove comment');
      }
    }
  };

  const handleDismissVideoFlag = (flagId) => {
    updateVideoFlagMutation.mutate({ flagId, status: 'dismissed' });
  };

  const handleRemoveVideo = async (flag) => {
    if (window.confirm('Are you sure you want to remove this video? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', flag.video_id);

        if (error) throw error;

        await updateVideoFlagMutation.mutateAsync({ flagId: flag.id, status: 'removed' });
        alert('Video removed successfully');
      } catch (error) {
        console.error('Error removing video:', error);
        alert('Failed to remove video');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || 0;
  };

  if (loading || !userChannel) {
    return (
      <div className="creator-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading live dashboard...</p>
      </div>
    );
  }

  return (
    <div className="creator-dashboard live-dashboard">
      {/* Live Status Indicator */}
      <div className="live-status-bar">
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">LIVE DASHBOARD</span>
        </div>
        <div className="live-viewers">
          <span className="viewer-icon">👁️</span>
          <span className="viewer-count">{liveViewers} watching now</span>
        </div>
        <div className="last-updated">
          Last updated: {formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>
            <span className="dashboard-title-main">Creator Studio</span>
            <span className="dashboard-title-sub">{userChannel.channel_name}</span>
          </h1>
          <div className="channel-quick-stats">
            <span className="quick-stat">
              <strong>{formatNumber(userChannel.subscriber_count || 0)}</strong> subscribers
            </span>
            <span className="quick-stat-dot">•</span>
            <span className="quick-stat">
              <strong>{stats?.totalVideos || 0}</strong> videos
            </span>
          </div>
        </div>
        <div className="dashboard-header-actions">
          <button 
            className="dashboard-action-button upload-button"
            onClick={() => navigate('/home')}
          >
            <span className="button-icon">📤</span>
            Upload Video
          </button>
          <button 
            className="dashboard-action-button channel-button"
            onClick={() => navigate(`/channel/${userChannel.channel_tag}`)}
          >
            <span className="button-icon">📺</span>
            View Channel
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <button
          className={`dashboard-nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="nav-icon">📊</span>
          Overview
        </button>
        <button
          className={`dashboard-nav-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="nav-icon">📈</span>
          Analytics
        </button>
        <button
          className={`dashboard-nav-button ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <span className="nav-icon">🔔</span>
          Activity Feed
          {recentActivity.length > 0 && (
            <span className="nav-badge">{recentActivity.length}</span>
          )}
        </button>
        <button
          className={`dashboard-nav-button ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          <span className="nav-icon">💬</span>
          Comments
          {stats?.flaggedComments > 0 && (
            <span className="nav-badge alert">{stats.flaggedComments}</span>
          )}
        </button>
        <button
          className={`dashboard-nav-button ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <span className="nav-icon">🎬</span>
          Videos
          {stats?.flaggedVideos > 0 && (
            <span className="nav-badge alert">{stats.flaggedVideos}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            {statsLoading ? (
              <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading stats...</p>
              </div>
            ) : (
              <>
                {/* Real-time Stats Grid */}
                <div className="dashboard-stats-grid live-stats">
                  <div className="dashboard-stat-card live-card">
                    <div className="stat-header">
                      <div className="stat-icon">📹</div>
                      <span className="stat-live-badge">LIVE</span>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{stats?.totalVideos || 0}</div>
                      <div className="stat-label">Total Videos</div>
                      <div className="stat-change positive">
                        +{stats?.recentVideos || 0} this month
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card live-card">
                    <div className="stat-header">
                      <div className="stat-icon">👁️</div>
                      <span className="stat-live-badge">LIVE</span>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatNumber(stats?.totalViews || 0)}</div>
                      <div className="stat-label">Total Views</div>
                      <div className="stat-sublabel">
                        Avg {formatNumber(Math.floor((stats?.totalViews || 0) / (stats?.totalVideos || 1)))} per video
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card live-card">
                    <div className="stat-header">
                      <div className="stat-icon">💬</div>
                      <span className="stat-live-badge">LIVE</span>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatNumber(stats?.totalComments || 0)}</div>
                      <div className="stat-label">Total Comments</div>
                      <div className="stat-sublabel">Across all videos</div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card live-card">
                    <div className="stat-header">
                      <div className="stat-icon">👍</div>
                      <span className="stat-live-badge">LIVE</span>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatNumber(stats?.totalLikes || 0)}</div>
                      <div className="stat-label">Total Likes</div>
                      <div className="stat-change positive">
                        {((stats?.totalLikes / (stats?.totalViews || 1)) * 100).toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                </div>

                {/* Moderation Alert */}
                {(stats?.flaggedComments > 0 || stats?.flaggedVideos > 0) && (
                  <div className="dashboard-alert urgent">
                    <div className="alert-icon pulsing">⚠️</div>
                    <div className="alert-content">
                      <h3>Urgent: Content Needs Review</h3>
                      <p>
                        You have {stats?.flaggedComments || 0} flagged comment(s) and{' '}
                        {stats?.flaggedVideos || 0} flagged video(s) that require immediate attention.
                      </p>
                      <div className="alert-actions">
                        {stats?.flaggedComments > 0 && (
                          <button 
                            className="alert-button"
                            onClick={() => setActiveTab('comments')}
                          >
                            Review Comments ({stats.flaggedComments})
                          </button>
                        )}
                        {stats?.flaggedVideos > 0 && (
                          <button 
                            className="alert-button"
                            onClick={() => setActiveTab('videos')}
                          >
                            Review Videos ({stats.flaggedVideos})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions-section">
                  <h3>Quick Actions</h3>
                  <div className="quick-actions-grid">
                    <button className="quick-action-card" onClick={() => navigate('/home')}>
                      <span className="action-icon">🎥</span>
                      <span className="action-title">Upload Video</span>
                      <span className="action-desc">Share new content</span>
                    </button>
                    <button className="quick-action-card" onClick={() => navigate('/analytics/demographics')}>
                      <span className="action-icon">📊</span>
                      <span className="action-title">View Analytics</span>
                      <span className="action-desc">Detailed insights</span>
                    </button>
                    <button className="quick-action-card" onClick={() => navigate('/channel/settings')}>
                      <span className="action-icon">⚙️</span>
                      <span className="action-title">Channel Settings</span>
                      <span className="action-desc">Customize your channel</span>
                    </button>
                    <button className="quick-action-card" onClick={() => setActiveTab('activity')}>
                      <span className="action-icon">📝</span>
                      <span className="action-title">Recent Activity</span>
                      <span className="action-desc">See what's happening</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="dashboard-analytics">
            <h2>Channel Analytics</h2>
            
            <div className="analytics-cards-grid">
              <div className="analytics-card">
                <h3>Performance Overview</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-label">Average View Duration</span>
                    <span className="metric-value">5:32</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Click-through Rate</span>
                    <span className="metric-value">4.2%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Engagement Rate</span>
                    <span className="metric-value">
                      {((stats?.totalLikes / (stats?.totalViews || 1)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Growth Trends</h3>
                <div className="growth-chart-placeholder">
                  <p>📈 Subscriber growth: +{Math.floor((userChannel.subscriber_count || 0) * 0.1)} this month</p>
                  <p>📊 View growth: +{formatNumber((stats?.totalViews || 0) * 0.15)} this month</p>
                  <button 
                    className="view-full-analytics-button"
                    onClick={() => navigate('/analytics/demographics')}
                  >
                    View Full Analytics →
                  </button>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Top Performing Videos</h3>
                <div className="top-videos-list">
                  <p className="placeholder-text">Your most viewed videos will appear here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="dashboard-activity">
            <h2>Live Activity Feed</h2>
            <p className="section-description">
              Real-time updates about your channel and content.
            </p>

            {recentActivity.length === 0 ? (
              <div className="dashboard-empty">
                <div className="empty-icon">📭</div>
                <h3>No Recent Activity</h3>
                <p>Activity on your channel will appear here in real-time.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className={`activity-item ${activity.type}`}>
                    <div className="activity-icon">
                      {activity.type === 'new_comment' && '💬'}
                      {activity.type === 'video_update' && '🎬'}
                      {activity.type === 'new_video' && '🎥'}
                      {activity.type === 'channel_update' && '📺'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-message">{activity.message}</p>
                      <span className="activity-time">{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="dashboard-flagged-section">
            <h2>Flagged Comments</h2>
            <p className="section-description">
              Review and moderate comments that have been flagged by the community.
            </p>

            {commentsLoading ? (
              <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading flagged comments...</p>
              </div>
            ) : flaggedComments.length === 0 ? (
              <div className="dashboard-empty">
                <div className="empty-icon">✅</div>
                <h3>No Flagged Comments</h3>
                <p>All clear! There are no comments waiting for review.</p>
              </div>
            ) : (
              <div className="flagged-items-list">
                {flaggedComments.map((flag) => (
                  <div key={flag.id} className="flagged-item">
                    <div className="flagged-item-header">
                      <span className="flag-reason-badge">{flag.reason}</span>
                      <span className="flag-time">{formatDate(flag.created_at)}</span>
                    </div>
                    
                    <div className="flagged-comment-content">
                      <div className="comment-author">
                        <strong>{flag.comments?.user_name}</strong>
                        <span className="comment-date">
                          {formatDate(flag.comments?.created_at)}
                        </span>
                      </div>
                      <p className="comment-text">{flag.comments?.comment_text}</p>
                    </div>

                    <div className="flagged-item-meta">
                      <span className="flag-reporter">
                        Flagged by: <strong>{flag.flagged_by_username}</strong>
                      </span>
                    </div>

                    <div className="flagged-item-actions">
                      <button
                        className="flag-action-button dismiss"
                        onClick={() => handleDismissCommentFlag(flag.id)}
                        disabled={updateCommentFlagMutation.isLoading}
                      >
                        Dismiss Flag
                      </button>
                      <button
                        className="flag-action-button remove"
                        onClick={() => handleRemoveComment(flag)}
                        disabled={deleteCommentMutation.isLoading || updateCommentFlagMutation.isLoading}
                      >
                        Remove Comment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="dashboard-flagged-section">
            <h2>Flagged Videos</h2>
            <p className="section-description">
              Review and manage videos that have been flagged by the community.
            </p>

            {videosLoading ? (
              <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading flagged videos...</p>
              </div>
            ) : flaggedVideos.length === 0 ? (
              <div className="dashboard-empty">
                <div className="empty-icon">✅</div>
                <h3>No Flagged Videos</h3>
                <p>All clear! There are no videos waiting for review.</p>
              </div>
            ) : (
              <div className="flagged-items-list">
                {flaggedVideos.map((flag) => (
                  <div key={flag.id} className="flagged-item">
                    <div className="flagged-item-header">
                      <span className="flag-reason-badge">{flag.reason}</span>
                      <span className="flag-time">{formatDate(flag.created_at)}</span>
                    </div>
                    
                    <div className="flagged-video-content">
                      <h3 className="video-title">{flag.video_title}</h3>
                      <button
                        className="view-video-button"
                        onClick={() => navigate(`/watch/${flag.video_id}`)}
                      >
                        View Video →
                      </button>
                    </div>

                    <div className="flagged-item-meta">
                      <span className="flag-reporter">
                        Flagged by: <strong>{flag.flagged_by_username}</strong>
                      </span>
                    </div>

                    <div className="flagged-item-actions">
                      <button
                        className="flag-action-button dismiss"
                        onClick={() => handleDismissVideoFlag(flag.id)}
                        disabled={updateVideoFlagMutation.isLoading}
                      >
                        Dismiss Flag
                      </button>
                      <button
                        className="flag-action-button remove"
                        onClick={() => handleRemoveVideo(flag)}
                        disabled={updateVideoFlagMutation.isLoading}
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
