import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllVideosFromSupabase, getChannelByTag, supabase, getSubscriberCount, isSubscribedToChannel, subscribeToChannel, unsubscribeFromChannel } from '../utils/supabase';
import ChannelAbout from './ChannelAbout';
import ChannelPlaylists from './ChannelPlaylists';
import EditChannel from './EditChannel';
import '../../styles/main.css';

export default function Channel() {
  const { channelTag } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [channelStats, setChannelStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0
  });
  const [activeTab, setActiveTab] = useState('videos');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get subscriber count - MUST be before any returns
  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ['subscriberCount', channelData?.channel_id],
    queryFn: () => getSubscriberCount(channelData.channel_id),
    enabled: !!channelData?.channel_id,
  });

  // Check if current user is subscribed - MUST be before any returns
  const { data: isSubscribed = false } = useQuery({
    queryKey: ['subscription', currentUserId, channelData?.channel_id],
    queryFn: () => isSubscribedToChannel(currentUserId, channelData.channel_id),
    enabled: !!currentUserId && !!channelData?.channel_id && !isOwner,
  });

  // Subscribe/unsubscribe mutation - MUST be before any returns
  const subscribeMutation = useMutation({
    mutationFn: () => {
      if (isSubscribed) {
        return unsubscribeFromChannel(currentUserId, channelData.channel_id);
      } else {
        return subscribeToChannel(currentUserId, channelData.channel_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription', currentUserId, channelData?.channel_id]);
      queryClient.invalidateQueries(['subscriberCount', channelData?.channel_id]);
    },
  });

  const handleSubscribeClick = () => {
    if (!currentUserId) {
      alert('Please sign in to subscribe');
      return;
    }
    subscribeMutation.mutate();
  };
  
  useEffect(() => {
    fetchChannelData();
  }, [channelTag]);

  const fetchChannelData = async () => {
    try {
      console.log("Loading channel data from Supabase");
      setLoading(true);
      
      let channel = null;
      let videos = [];
      
      // If channelTag is provided, fetch specific channel
      if (channelTag) {
        console.log(`Fetching channel: @${channelTag}`);
        channel = await getChannelByTag(channelTag);
        
        if (!channel) {
          setError(`Channel @${channelTag} not found`);
          setLoading(false);
          return;
        }
        
        setChannelData(channel);
        
        // Check if the logged-in user owns this channel
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setCurrentUserId(currentUser?.id || null);
        if (currentUser && currentUser.id === channel.user_id) {
          setUserData(currentUser);
          setIsOwner(true);
        } else {
          // For other users' channels, we'll need to fetch from a profiles table or use default
          // For now, we can construct URLs based on user_id
          setUserData({
            user_metadata: {
              avatar_url: `${supabase.storage.from('avatars').getPublicUrl(`profile-pictures/${channel.user_id}.jpg`).data.publicUrl}`,
              banner_url: `${supabase.storage.from('avatars').getPublicUrl(`banners/${channel.user_id}.jpg`).data.publicUrl}`
            }
          });
        }
        
        // Fetch videos for this channel
        const { data, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('channel_id', channel.channel_id)
          .order('created_at', { ascending: false });
        
        if (videoError) throw videoError;
        videos = data || [];
      } else {
        // No channelTag - fetch all videos
        videos = await getAllVideosFromSupabase();
      }
      
      console.log(`Loaded ${videos.length} video(s)`);
      
      // Calculate channel statistics
      const stats = {
        totalVideos: videos.length,
        totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0),
        totalLikes: videos.reduce((sum, video) => sum + (video.likes || 0), 0)
      };
      
      setVideos(videos);
      setChannelStats(stats);
      setError(null);
    } catch (err) {
      console.error("Error loading channel data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="channel-loading">
        <p>Loading channel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-error">
        <p>Error: {error}</p>
        <button onClick={fetchChannelData} className="channel-retry-button">
          Retry
        </button>
      </div>
    );
  }

  const displayName = channelData?.channel_name || (videos.length > 0 && videos[0].channel_name) || 'My Channel';
  const channelHandle = channelData?.channel_tag || '';
  const channelDesc = channelData?.channel_description || '';
  const avatarUrl = userData?.user_metadata?.avatar_url;
  const bannerUrl = userData?.user_metadata?.banner_url;

  return (
    <div className="channel-container">
      {/* Channel Header */}
      <div className="channel-header">
        <div 
          className="channel-banner"
          style={{
            backgroundImage: bannerUrl 
              ? `url(${bannerUrl})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="channel-avatar">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '50%' 
                }} 
              />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="channel-info">
            <h1 className="channel-name">{displayName}</h1>
            {channelHandle && <p className="channel-handle">@{channelHandle}</p>}
            {channelDesc && <p className="channel-description">{channelDesc}</p>}
            <div className="channel-meta">
              <span>{subscriberCount.toLocaleString()} {subscriberCount === 1 ? 'subscriber' : 'subscribers'}</span>
              <span>•</span>
              <span>{channelStats.totalVideos} videos</span>
              <span>•</span>
              <span>{channelStats.totalViews.toLocaleString()} views</span>
            </div>
            <div className="channel-actions">
              {!isOwner && currentUserId && (
                <button 
                  className={`channel-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                  onClick={handleSubscribeClick}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending 
                    ? '...' 
                    : isSubscribed 
                      ? 'Subscribed' 
                      : 'Subscribe'}
                </button>
              )}
              {isOwner && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="channel-edit-btn"
                    onClick={() => setShowEditModal(true)}
                  >
                    Edit Channel
                  </button>
                  <button 
                    className="channel-settings-btn"
                    onClick={() => navigate('/channel/settings')}
                  >
                    ⚙️ Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Channel Navigation */}
      <div className="channel-nav">
        <button 
          className={`channel-nav-button ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos
        </button>
        <button 
          className={`channel-nav-button ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists
        </button>
        <button 
          className={`channel-nav-button ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'videos' ? (
        <div className="channel-content">
          <div className="channel-section-header">
            <h2>Uploads</h2>
            <button onClick={fetchChannelData} className="channel-refresh-button">
              Refresh
            </button>
          </div>

          {videos.length === 0 ? (
            <div className="channel-empty">
              <p>No videos uploaded yet. Start creating content!</p>
            </div>
          ) : (
            <div className="channel-video-grid">
              {videos.map((video) => (
                <ChannelVideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'playlists' ? (
        <ChannelPlaylists userId={channelData?.user_id} />
      ) : (
        <ChannelAbout 
          channelData={channelData} 
          channelStats={channelStats} 
          userData={userData} 
        />
      )}

      {/* Edit Channel Modal */}
      {showEditModal && (
        <EditChannel
          channelData={{
            ...channelData,
            avatar_url: avatarUrl,
            banner_url: bannerUrl
          }}
          onClose={() => setShowEditModal(false)}
          onUpdate={fetchChannelData}
        />
      )}
    </div>
  );
}

function ChannelVideoCard({ video }) {
  const [timeAgo, setTimeAgo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const updateTimeAgo = () => {
      if (video.created_at) {
        const now = new Date();
        const uploaded = new Date(video.created_at);
        const seconds = Math.floor((now - uploaded) / 1000);
        
        if (seconds < 60) setTimeAgo(`${seconds}s ago`);
        else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
        else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
        else if (seconds < 604800) setTimeAgo(`${Math.floor(seconds / 86400)}d ago`);
        else if (seconds < 2592000) setTimeAgo(`${Math.floor(seconds / 604800)}w ago`);
        else if (seconds < 31536000) setTimeAgo(`${Math.floor(seconds / 2592000)}mo ago`);
        else setTimeAgo(`${Math.floor(seconds / 31536000)}y ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [video.created_at]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = () => {
    navigate(`/watch/${video.id}`);
  };

  return (
    <div onClick={handleVideoClick} className="channel-video-card">
      {/* Thumbnail */}
      <div className="channel-video-thumbnail">
        <img
          src={video.thumbnail_url || "https://placehold.co/320x180?text=No+Thumbnail"}
          alt={video.title}
        />
        {video.duration > 0 && (
          <div className="channel-video-duration">
            {formatDuration(video.duration)}
          </div>
        )}
        {video.is_public === false && (
          <div className="channel-video-privacy">
            🔒 Private
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="channel-video-info">
        <h3 className="channel-video-title">{video.title}</h3>
        
        <div className="channel-video-stats">
          <span>{video.views.toLocaleString()} views</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>

        {video.description && (
          <p className="channel-video-description">
            {video.description}
          </p>
        )}

        <div className="channel-video-engagement">
          <span>👍 {video.likes || 0}</span>
          <span>👎 {video.dislikes || 0}</span>
        </div>
      </div>
    </div>
  );
}
