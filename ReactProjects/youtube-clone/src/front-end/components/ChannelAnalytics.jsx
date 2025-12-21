import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import '../../styles/main.css';

/**
 * ChannelAnalytics Component
 * 
 * Displays comprehensive analytics for a channel including:
 * - Total views across all videos
 * - Subscriber count
 * - Total videos
 * - Engagement metrics (likes, comments)
 * - Growth trends
 * - Top performing videos
 */
export default function ChannelAnalytics({ channelId, channelData }) {
  // Fetch all videos for this channel
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['channelVideos', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!channelId,
  });

  // Fetch subscriber count
  const { data: subscribers = 0, isLoading: subscribersLoading } = useQuery({
    queryKey: ['subscriberCount', channelId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!channelId,
  });

  // Fetch comment count for engagement
  const { data: totalComments = 0 } = useQuery({
    queryKey: ['channelComments', channelId],
    queryFn: async () => {
      const videoIds = videos.map(v => v.id);
      if (videoIds.length === 0) return 0;
      
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('video_id', videoIds);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: videos.length > 0,
  });

  // Calculate analytics from videos
  const analytics = useMemo(() => {
    if (!videos.length) return null;

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
    const totalDislikes = videos.reduce((sum, v) => sum + (v.dislikes || 0), 0);
    const totalVideos = videos.length;
    
    // Calculate averages
    const avgViewsPerVideo = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;
    const avgLikesPerVideo = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;
    
    // Calculate engagement rate (likes per view)
    const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0;
    
    // Calculate like ratio
    const totalReactions = totalLikes + totalDislikes;
    const likeRatio = totalReactions > 0 ? ((totalLikes / totalReactions) * 100).toFixed(1) : 0;
    
    // Find top performing videos
    const topVideos = [...videos]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
    
    // Calculate recent growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVideos = videos.filter(v => 
      new Date(v.created_at) > thirtyDaysAgo
    );
    const recentViews = recentVideos.reduce((sum, v) => sum + (v.views || 0), 0);
    
    return {
      totalViews,
      totalLikes,
      totalDislikes,
      totalVideos,
      avgViewsPerVideo,
      avgLikesPerVideo,
      engagementRate,
      likeRatio,
      topVideos,
      recentVideos: recentVideos.length,
      recentViews,
    };
  }, [videos]);

  if (videosLoading || subscribersLoading) {
    return (
      <div className="channel-analytics-loading">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="channel-analytics-empty">
        <p>📊 No analytics data available yet</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Upload your first video to start seeing analytics!
        </p>
      </div>
    );
  }

  return (
    <div className="channel-analytics">
      <h2 className="analytics-title">📊 Channel Analytics</h2>
      
      {/* Key Metrics Cards */}
      <div className="analytics-grid">
        {/* Total Views */}
        <div className="analytics-card">
          <div className="analytics-card-icon">👁️</div>
          <div className="analytics-card-content">
            <h3 className="analytics-card-value">
              {analytics.totalViews.toLocaleString()}
            </h3>
            <p className="analytics-card-label">Total Views</p>
            <p className="analytics-card-sublabel">
              {analytics.avgViewsPerVideo.toLocaleString()} avg per video
            </p>
          </div>
        </div>

        {/* Subscribers */}
        <div className="analytics-card">
          <div className="analytics-card-icon">👥</div>
          <div className="analytics-card-content">
            <h3 className="analytics-card-value">
              {subscribers.toLocaleString()}
            </h3>
            <p className="analytics-card-label">Subscribers</p>
            <p className="analytics-card-sublabel">
              {channelData?.subscriber_count || 0} total
            </p>
          </div>
        </div>

        {/* Total Videos */}
        <div className="analytics-card">
          <div className="analytics-card-icon">🎬</div>
          <div className="analytics-card-content">
            <h3 className="analytics-card-value">
              {analytics.totalVideos}
            </h3>
            <p className="analytics-card-label">Videos Published</p>
            <p className="analytics-card-sublabel">
              {analytics.recentVideos} in last 30 days
            </p>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="analytics-card">
          <div className="analytics-card-icon">💬</div>
          <div className="analytics-card-content">
            <h3 className="analytics-card-value">
              {analytics.engagementRate}%
            </h3>
            <p className="analytics-card-label">Engagement Rate</p>
            <p className="analytics-card-sublabel">
              {totalComments.toLocaleString()} comments
            </p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">💡 Engagement Metrics</h3>
        <div className="analytics-metrics-grid">
          <div className="analytics-metric">
            <span className="analytics-metric-label">Total Likes</span>
            <span className="analytics-metric-value">
              👍 {analytics.totalLikes.toLocaleString()}
            </span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Total Dislikes</span>
            <span className="analytics-metric-value">
              👎 {analytics.totalDislikes.toLocaleString()}
            </span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Like Ratio</span>
            <span className="analytics-metric-value">
              {analytics.likeRatio}%
            </span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Avg Likes/Video</span>
            <span className="analytics-metric-value">
              {analytics.avgLikesPerVideo.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">📈 Last 30 Days</h3>
        <div className="analytics-recent-stats">
          <div className="analytics-recent-item">
            <span className="analytics-recent-label">Videos Uploaded</span>
            <span className="analytics-recent-value">
              {analytics.recentVideos}
            </span>
          </div>
          <div className="analytics-recent-item">
            <span className="analytics-recent-label">Views Gained</span>
            <span className="analytics-recent-value">
              {analytics.recentViews.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Top Performing Videos */}
      {analytics.topVideos.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-section-title">🏆 Top Performing Videos</h3>
          <div className="analytics-top-videos">
            {analytics.topVideos.map((video, index) => (
              <div key={video.id} className="analytics-top-video">
                <span className="analytics-top-video-rank">#{index + 1}</span>
                <div className="analytics-top-video-thumbnail">
                  <img
                    src={video.thumbnail_url || 'https://placehold.co/120x68?text=No+Thumbnail'}
                    alt={video.title}
                    loading="lazy"
                  />
                </div>
                <div className="analytics-top-video-info">
                  <h4 className="analytics-top-video-title">{video.title}</h4>
                  <div className="analytics-top-video-stats">
                    <span>👁️ {video.views.toLocaleString()} views</span>
                    <span>•</span>
                    <span>👍 {video.likes.toLocaleString()} likes</span>
                    <span>•</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tip */}
      <div className="analytics-tip">
        <div className="analytics-tip-icon">💡</div>
        <div className="analytics-tip-content">
          <h4>Pro Tip</h4>
          <p>
            Consistent uploads and engaging content help grow your channel. 
            Try to maintain an engagement rate above 5% for healthy growth!
          </p>
        </div>
      </div>
    </div>
  );
}
