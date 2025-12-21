import { useState, useEffect } from 'react';
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

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [userChannel, setUserChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

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
          // User doesn't have a channel
          navigate('/');
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

  // Query dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats', userChannel?.channel_id],
    queryFn: () => getChannelDashboardStats(userChannel.channel_id),
    enabled: !!userChannel?.channel_id,
    staleTime: 30000, // 30 seconds
  });

  // Query flagged comments
  const { data: flaggedComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['flaggedComments', userChannel?.channel_id],
    queryFn: () => getFlaggedCommentsForChannel(userChannel.channel_id),
    enabled: !!userChannel?.channel_id && activeTab === 'comments',
    staleTime: 30000,
  });

  // Query flagged videos
  const { data: flaggedVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['flaggedVideos', userChannel?.channel_id],
    queryFn: () => getFlaggedVideosForChannel(userChannel.channel_id),
    enabled: !!userChannel?.channel_id && activeTab === 'videos',
    staleTime: 30000,
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
        // Delete the video
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

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading || !userChannel) {
    return (
      <div className="creator-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="creator-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Creator Dashboard</h1>
          <p className="dashboard-subtitle">Manage your channel: {userChannel.channel_name}</p>
        </div>
        <button 
          className="dashboard-back-button"
          onClick={() => navigate(`/channel/${userChannel.channel_tag}`)}
        >
          View Channel
        </button>
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
          className={`dashboard-nav-button ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          <span className="nav-icon">💬</span>
          Flagged Comments
          {stats?.flaggedComments > 0 && (
            <span className="nav-badge">{stats.flaggedComments}</span>
          )}
        </button>
        <button
          className={`dashboard-nav-button ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <span className="nav-icon">🎬</span>
          Flagged Videos
          {stats?.flaggedVideos > 0 && (
            <span className="nav-badge">{stats.flaggedVideos}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <h2>Channel Overview</h2>
            
            {statsLoading ? (
              <div className="dashboard-loading">Loading stats...</div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="dashboard-stats-grid">
                  <div className="dashboard-stat-card">
                    <div className="stat-icon">📹</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats?.totalVideos || 0}</div>
                      <div className="stat-label">Total Videos</div>
                      <div className="stat-sublabel">{stats?.recentVideos || 0} in last 30 days</div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <div className="stat-icon">👁️</div>
                    <div className="stat-content">
                      <div className="stat-value">{(stats?.totalViews || 0).toLocaleString()}</div>
                      <div className="stat-label">Total Views</div>
                      <div className="stat-sublabel">
                        Avg {Math.floor((stats?.totalViews || 0) / (stats?.totalVideos || 1))} per video
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats?.totalComments || 0}</div>
                      <div className="stat-label">Total Comments</div>
                      <div className="stat-sublabel">Across all videos</div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <div className="stat-icon">👍</div>
                    <div className="stat-content">
                      <div className="stat-value">{(stats?.totalLikes || 0).toLocaleString()}</div>
                      <div className="stat-label">Total Likes</div>
                      <div className="stat-sublabel">
                        Avg {Math.floor((stats?.totalLikes || 0) / (stats?.totalVideos || 1))} per video
                      </div>
                    </div>
                  </div>
                </div>

                {/* Moderation Alert */}
                {(stats?.flaggedComments > 0 || stats?.flaggedVideos > 0) && (
                  <div className="dashboard-alert">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-content">
                      <h3>Content Needs Review</h3>
                      <p>
                        You have {stats?.flaggedComments || 0} flagged comment(s) and{' '}
                        {stats?.flaggedVideos || 0} flagged video(s) waiting for review.
                      </p>
                      <div className="alert-actions">
                        {stats?.flaggedComments > 0 && (
                          <button 
                            className="alert-button"
                            onClick={() => setActiveTab('comments')}
                          >
                            Review Comments
                          </button>
                        )}
                        {stats?.flaggedVideos > 0 && (
                          <button 
                            className="alert-button"
                            onClick={() => setActiveTab('videos')}
                          >
                            Review Videos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Tips */}
                <div className="dashboard-tips">
                  <h3>Creator Tips</h3>
                  <ul className="tips-list">
                    <li>Review flagged content promptly to maintain community standards</li>
                    <li>Engage with your audience by responding to comments</li>
                    <li>Upload consistently to grow your channel</li>
                    <li>Use descriptive titles and tags for better discoverability</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="dashboard-flagged-section">
            <h2>Flagged Comments</h2>
            <p className="section-description">
              Review and take action on comments that have been flagged by users.
            </p>

            {commentsLoading ? (
              <div className="dashboard-loading">Loading flagged comments...</div>
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
              Review and take action on videos that have been flagged by users.
            </p>

            {videosLoading ? (
              <div className="dashboard-loading">Loading flagged videos...</div>
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
