import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVideoFromSupabase, updateVideoInSupabase, getAllVideosFromSupabase, getSubtitlesForVideo, supabase } from '../utils/supabase';
import { throttle } from '../utils/rateLimiting';
import { PlaybackTracker } from '../utils/playbackAnalytics';
import ABRManager from '../utils/abrManager';
import { QUALITY_LEVELS, formatBytes, formatBitrate, getUserBandwidthPreferences, updateBandwidthPreferences } from '../utils/compressionUtils';
import CommentFeed from './CommentFeed.jsx';
import RecomendationBar from "./RecomendationBar.jsx";
import SaveToPlaylist from './SaveToPlaylist.jsx';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [timeAgo, setTimeAgo] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userReaction, setUserReaction] = useState(null); // 'like', 'dislike', or null
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  
  // Video player controls
  const videoRef = useRef(null);
  const playbackTrackerRef = useRef(null);
  const abrManagerRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [bufferingEvents, setBufferingEvents] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [upNextVideos, setUpNextVideos] = useState([]);
  const [subtitles, setSubtitles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [autoplay, setAutoplay] = useState(() => {
    // Get initial value from localStorage for non-logged-in users
    const stored = localStorage.getItem('videoAutoplay');
    return stored !== null ? stored === 'true' : true; // default to true
  });
  const [showAutoplayMenu, setShowAutoplayMenu] = useState(false);

  // Fetch video with caching
  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      console.log(`📹 Loading video: ${videoId}`);
      const videoData = await getVideoFromSupabase(videoId);
      
      if (!videoData) {
        throw new Error("Video not found");
      }
      
      console.log("✅ Video loaded successfully");
      return videoData;
    },
    enabled: !!videoId,
  });

  // Increment view count mutation
  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      const currentViews = video?.views || 0;
      return await updateVideoInSupabase(videoId, { views: currentViews + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['video', videoId]);
    },
  });

  // Update likes/dislikes mutation
  const updateReactionMutation = useMutation({
    mutationFn: async ({ likes, dislikes }) => {
      return await updateVideoInSupabase(videoId, { likes, dislikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['video', videoId]);
    },
  });

  // Increment views on mount
  useEffect(() => {
    if (video) {
      incrementViewsMutation.mutate();
    }
  }, [video?.id]);

  // Get current user and load autoplay preference
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Load autoplay preference from user settings if logged in
      if (user) {
        try {
          const preferences = await getUserBandwidthPreferences(user.id);
          if (preferences && preferences.autoplay !== undefined) {
            setAutoplay(preferences.autoplay);
          }
        } catch (error) {
          console.error('Error loading autoplay preference:', error);
        }
      }
    };
    fetchUser();
  }, []);

  // Initialize playback tracker and ABR manager
  useEffect(() => {
    if (!video || !videoRef.current) return;

    const tracker = new PlaybackTracker(videoId, currentUser?.id);
    playbackTrackerRef.current = tracker;

    // Initialize ABR Manager
    const abrManager = new ABRManager(videoRef.current, currentUser?.id);
    abrManagerRef.current = abrManager;
    
    // Initialize ABR with video ID
    abrManager.initialize(videoId).then(() => {
      const metrics = abrManager.getMetrics();
      setQuality(metrics.currentQuality);
      setNetworkSpeed(metrics.currentSpeed);
    });

    // Listen for quality changes from ABR
    const handleQualityChange = (event) => {
      setQuality(event.detail.newQuality);
      
      // Log quality change to playback tracker
      if (tracker) {
        tracker.logEvent('quality_change', event.detail.newQuality, {
          from: event.detail.oldQuality,
          to: event.detail.newQuality,
          auto: event.detail.auto
        });
      }
    };

    videoRef.current.addEventListener('qualitychange', handleQualityChange);

    // Start tracking session when video metadata is loaded
    const handleLoadedMetadata = async () => {
      const duration = videoRef.current.duration;
      await tracker.startSession(duration);
    };

    // Event listeners
    const handlePlay = () => {
      const currentTime = videoRef.current?.currentTime || 0;
      tracker.onPlay(currentTime);
    };

    const handlePause = () => {
      const currentTime = videoRef.current?.currentTime || 0;
      tracker.onPause(currentTime);
    };

    const handleSeeking = () => {
      const from = tracker.lastPosition;
      const to = videoRef.current?.currentTime || 0;
      tracker.onSeek(from, to);
    };

    const handleEnded = () => {
      const finalTime = videoRef.current?.currentTime || 0;
      tracker.onEnded(finalTime);
    };

    const handleTimeUpdate = () => {
      const currentTime = videoRef.current?.currentTime || 0;
      tracker.updateWatchTime(currentTime);
    };

    const handleWaiting = () => {
      setBufferingEvents(prev => prev + 1);
    };

    const videoElement = videoRef.current;
    
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('seeking', handleSeeking);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('waiting', handleWaiting);

    // Update network speed periodically
    const speedInterval = setInterval(() => {
      if (abrManager) {
        const metrics = abrManager.getMetrics();
        setNetworkSpeed(metrics.currentSpeed);
        setBufferingEvents(metrics.bufferingEvents);
      }
    }, 2000);

    // Cleanup
    return () => {
      clearInterval(speedInterval);
      
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('seeking', handleSeeking);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('waiting', handleWaiting);
        videoElement.removeEventListener('qualitychange', handleQualityChange);
      }
      
      if (tracker) {
        const currentTime = videoRef.current?.currentTime || 0;
        tracker.endSession(currentTime);
        tracker.destroy();
      }

      if (abrManager) {
        abrManager.destroy(videoId);
      }
    };
  }, [video, videoId, currentUser]);

  // Load up next videos
  useEffect(() => {
    const loadUpNextVideos = async () => {
      try {
        const allVideos = await getAllVideosFromSupabase();
        // Filter out current video and get 10 random videos
        const filtered = allVideos
          .filter(v => v.id !== videoId)
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
        setUpNextVideos(filtered);
      } catch (error) {
        console.error('Error loading up next videos:', error);
      }
    };
    loadUpNextVideos();
  }, [videoId]);
  // Apply playback speed when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSpeedMenu || showQualityMenu || showAutoplayMenu) {
        const target = event.target;
        const isInsideMenu = target.closest('[data-menu]');
        if (!isInsideMenu) {
          setShowSpeedMenu(false);
          setShowQualityMenu(false);
          setShowAutoplayMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu, showQualityMenu, showAutoplayMenu]);

  // Load subtitles for the video
  useEffect(() => {
    const loadSubtitles = async () => {
      if (videoId) {
        try {
          const subs = await getSubtitlesForVideo(videoId);
          setSubtitles(subs);
          console.log('📝 Loaded subtitles:', subs);
        } catch (error) {
          console.error('Error loading subtitles:', error);
        }
      }
    };
    loadSubtitles();
  }, [videoId]);

  // Update time ago
  useEffect(() => {
    const updateTimeAgo = () => {
      if (video?.created_at) {
        const now = new Date();
        const uploaded = new Date(video.created_at);
        const seconds = Math.floor((now - uploaded) / 1000);
        
        if (seconds < 60) setTimeAgo(`${seconds} seconds ago`);
        else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)} minutes ago`);
        else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)} hours ago`);
        else if (seconds < 604800) setTimeAgo(`${Math.floor(seconds / 86400)} days ago`);
        else if (seconds < 2592000) setTimeAgo(`${Math.floor(seconds / 604800)} weeks ago`);
        else if (seconds < 31536000) setTimeAgo(`${Math.floor(seconds / 2592000)} months ago`);
        else setTimeAgo(`${Math.floor(seconds / 31536000)} years ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [video?.created_at]);

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    console.log(isSubscribed ? "Unsubscribed" : "Subscribed!");
  };

  // Throttle like/dislike to prevent spam (1 action per second)
  const throttledLikeAction = useCallback(
    throttle((newLikes, newDislikes) => {
      updateReactionMutation.mutate({ likes: newLikes, dislikes: newDislikes });
    }, 1000), // 1 second throttle
    [updateReactionMutation]
  );

  const handleLike = async () => {
    const currentLikes = video?.likes || 0;
    const currentDislikes = video?.dislikes || 0;
    let newLikes = currentLikes;
    let newDislikes = currentDislikes;

    if (userReaction === 'like') {
      // Remove like
      newLikes = currentLikes - 1;
      setUserReaction(null);
    } else {
      // Add like
      if (userReaction === 'dislike') {
        newDislikes = currentDislikes - 1;
      }
      newLikes = currentLikes + 1;
      setUserReaction('like');
    }

    throttledLikeAction(newLikes, newDislikes);
  };

  // Playback speed handler
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    
    // Log speed change event
    if (playbackTrackerRef.current && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      playbackTrackerRef.current.onSpeedChange(currentTime, speed);
    }
  };

  // Quality handler
  const handleQualityChange = (qualityLevel) => {
    setQuality(qualityLevel);
    setShowQualityMenu(false);
    
    // Use ABR manager to change quality
    if (abrManagerRef.current) {
      if (qualityLevel === 'auto') {
        abrManagerRef.current.setAutoQuality(true);
      } else {
        abrManagerRef.current.setAutoQuality(false);
        abrManagerRef.current.setQuality(qualityLevel);
      }
    }
    
    // Log quality change event
    if (playbackTrackerRef.current && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      playbackTrackerRef.current.onQualityChange(currentTime, qualityLevel);
    }
    
    console.log(`Quality changed to: ${qualityLevel}`);
  };

  // Autoplay toggle handler
  const handleAutoplayToggle = async () => {
    const newAutoplay = !autoplay;
    setAutoplay(newAutoplay);
    setShowAutoplayMenu(false);
    
    // Save to localStorage for non-logged-in users
    localStorage.setItem('videoAutoplay', newAutoplay.toString());
    
    // Save to user preferences if logged in
    if (currentUser) {
      try {
        await updateBandwidthPreferences(currentUser.id, {
          autoplay: newAutoplay
        });
        console.log(`Autoplay ${newAutoplay ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving autoplay preference:', error);
      }
    }
  };

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDislike = async () => {
    const currentLikes = video?.likes || 0;
    const currentDislikes = video?.dislikes || 0;
    let newLikes = currentLikes;
    let newDislikes = currentDislikes;

    if (userReaction === 'dislike') {
      // Remove dislike
      newDislikes = currentDislikes - 1;
      setUserReaction(null);
    } else {
      // Add dislike
      if (userReaction === 'like') {
        newLikes = currentLikes - 1;
      }
      newDislikes = currentDislikes + 1;
      setUserReaction('dislike');
    }

    throttledLikeAction(newLikes, newDislikes);
  };

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "400px"
      }}>
        Loading video...
      </div>
    );
  }

  if (error || !video) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "400px",
        gap: "20px"
      }}>
        <p style={{ fontSize: "18px", color: "#666" }}>
          {error?.message || "Video not found"}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: "10px 20px",
            backgroundColor: "#cc0000",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", maxWidth: "1800px", margin: "0 auto", padding: "20px" }}>
      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e0e0e0"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
        >
          <span>←</span> Back
        </button>

        {/* Video Player Container */}
        <div style={{ position: "relative", backgroundColor: "#000", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
          <video
            ref={videoRef}
            controls
            autoPlay={autoplay}
            crossOrigin="anonymous"
            style={{
              width: "100%",
              maxHeight: "720px",
              display: "block"
            }}
            src={video?.video_url}
            poster={video?.thumbnail_url}
            onError={(e) => console.error("❌ Video playback error:", e)}
          >
            {subtitles.map((subtitle) => (
              <track
                key={subtitle.id}
                kind="captions"
                src={subtitle.subtitle_url}
                srcLang={subtitle.language}
                label={subtitle.label}
                default={subtitle.is_default}
              />
            ))}
          </video>
          
          {/* Custom Controls Overlay */}
          <div style={{
            position: "absolute",
            bottom: "60px",
            right: "10px",
            display: "flex",
            gap: "8px",
            zIndex: 10
          }}>
            {/* Autoplay Toggle */}
            <div style={{ position: "relative" }} data-menu>
              <button
                onClick={() => setShowAutoplayMenu(!showAutoplayMenu)}
                title={autoplay ? "Autoplay: ON" : "Autoplay: OFF"}
                style={{
                  padding: "8px 12px",
                  backgroundColor: autoplay ? "rgba(102, 126, 234, 0.9)" : "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {autoplay ? "🔁" : "⏸️"}
                <span>Autoplay</span>
              </button>
              {showAutoplayMenu && (
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 5px)",
                  right: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  padding: "8px",
                  minWidth: "150px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)"
                }}>
                  <button
                    onClick={handleAutoplayToggle}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: "transparent",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      textAlign: "left",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span>{autoplay ? "Turn OFF" : "Turn ON"}</span>
                    <span style={{ fontSize: "16px" }}>{autoplay ? "✓" : ""}</span>
                  </button>
                  <div style={{
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.6)",
                    padding: "8px 12px 4px",
                    lineHeight: "1.3"
                  }}>
                    {autoplay ? "Videos will play automatically" : "Videos require manual play"}
                  </div>
                </div>
              )}
            </div>
            
            {/* Playback Speed Control */}
            <div style={{ position: "relative" }} data-menu>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div style={{
                  position: "absolute",
                  bottom: "40px",
                  right: 0,
                  backgroundColor: "rgba(28, 28, 28, 0.95)",
                  borderRadius: "4px",
                  padding: "8px 0",
                  minWidth: "100px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                }}>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        backgroundColor: playbackSpeed === speed ? "rgba(255, 255, 255, 0.2)" : "transparent",
                        color: "white",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = playbackSpeed === speed ? "rgba(255, 255, 255, 0.2)" : "transparent"}
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Control */}
            <div style={{ position: "relative" }} data-menu>
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                {quality === 'auto' ? `Auto (${networkSpeed > 0 ? formatBitrate(networkSpeed) : '...'})` : quality}
              </button>
              {showQualityMenu && (
                <div style={{
                  position: "absolute",
                  bottom: "40px",
                  right: 0,
                  backgroundColor: "rgba(28, 28, 28, 0.95)",
                  borderRadius: "4px",
                  padding: "8px 0",
                  minWidth: "180px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                }}>
                  <div style={{
                    padding: "8px 16px",
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.6)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
                  }}>
                    {networkSpeed > 0 && `Network: ${formatBitrate(networkSpeed)}`}
                    {bufferingEvents > 0 && ` • ${bufferingEvents} buffering`}
                  </div>
                  {['auto', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'].map(q => {
                    const qualityInfo = QUALITY_LEVELS[q];
                    return (
                      <button
                        key={q}
                        onClick={() => handleQualityChange(q)}
                        style={{
                          width: "100%",
                          padding: "8px 16px",
                          backgroundColor: quality === q ? "rgba(255, 255, 255, 0.2)" : "transparent",
                          color: "white",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "13px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = quality === q ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = quality === q ? "rgba(255, 255, 255, 0.2)" : "transparent"}
                      >
                        <span>{q === 'auto' ? 'Auto (Recommended)' : qualityInfo?.label || q}</span>
                        {qualityInfo && (
                          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                            {formatBitrate(qualityInfo.bitrate)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ 
          fontSize: "24px", 
          fontWeight: "600",
          margin: "0 0 12px 0",
          lineHeight: "1.3"
        }}>
          {video.title}
        </h1>

        {/* Channel Info */}
        {video.channel_name && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
            paddingBottom: "16px",
            borderBottom: "1px solid #e0e0e0"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold"
            }}>
              {video.channel_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
              onClick={() => navigate('/channel')}
              onMouseEnter={(e) => e.currentTarget.style.color = "#007bff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "inherit"}
              >
                {video.channel_name}
              </h3>
            </div>
          </div>
        )}

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            fontSize: "14px",
            color: "#666",
            flexWrap: "wrap"
          }}>
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span>{timeAgo}</span>
            {video.quality && (
              <>
                <span>•</span>
                <span style={{ 
                  backgroundColor: "#667eea20", 
                  color: "#667eea", 
                  padding: "2px 8px", 
                  borderRadius: "4px",
                  fontWeight: "600"
                }}>
                  {video.quality}
                </span>
              </>
            )}
            {video.aspect_ratio && (
              <>
                <span>•</span>
                <span>{video.aspect_ratio}</span>
              </>
            )}
          </div>

          {/* Like/Dislike buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleLike}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: userReaction === 'like' ? "#e0e0e0" : "white",
                border: "1px solid #ddd",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = userReaction === 'like' ? "#e0e0e0" : "white"}
            >
              <span style={{ fontSize: "18px" }}>👍</span>
              <span>{(video?.likes || 0).toLocaleString()}</span>
            </button>

            <button
              onClick={handleDislike}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: userReaction === 'dislike' ? "#e0e0e0" : "white",
                border: "1px solid #ddd",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = userReaction === 'dislike' ? "#e0e0e0" : "white"}
            >
              <span style={{ fontSize: "18px" }}>👎</span>
              <span>{(video?.dislikes || 0).toLocaleString()}</span>
            </button>

            <button
              onClick={() => setShowPlaylistModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
            >
              <span style={{ fontSize: "18px" }}>📋</span>
              <span>Save</span>
            </button>

            <button
              onClick={handleSubscribe}
              style={{
                padding: "10px 20px",
                backgroundColor: isSubscribed ? "#606060" : "#cc0000",
                color: "white",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                marginLeft: "8px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <CommentFeed videoId={videoId} />
      </div>

      {/* Up Next Sidebar */}
      <div style={{
        width: "400px",
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "16px",
          color: "#333"
        }}>
          Up Next
        </h2>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          paddingRight: "8px"
        }}>
          {upNextVideos.map((upNextVideo) => (
            <div
              key={upNextVideo.id}
              onClick={() => navigate(`/watch/${upNextVideo.id}`)}
              style={{
                display: "flex",
                gap: "12px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {/* Thumbnail */}
              <div style={{
                position: "relative",
                width: "168px",
                height: "94px",
                flexShrink: 0,
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "#e0e0e0"
              }}>
                <img
                  src={upNextVideo.thumbnail_url || "https://placehold.co/168x94?text=No+Thumbnail"}
                  alt={upNextVideo.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                {upNextVideo.duration > 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: "4px",
                    right: "4px",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "2px",
                    fontSize: "11px",
                    fontWeight: "600"
                  }}>
                    {formatDuration(upNextVideo.duration)}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  margin: "0 0 4px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  lineHeight: "1.4",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {upNextVideo.title}
                </h3>
                <p style={{
                  margin: "0 0 4px 0",
                  fontSize: "12px",
                  color: "#666"
                }}>
                  {upNextVideo.channel_name}
                </p>
                <div style={{
                  fontSize: "12px",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>{upNextVideo.views?.toLocaleString() || 0} views</span>
                  {upNextVideo.quality && (
                    <>
                      <span>•</span>
                      <span style={{
                        backgroundColor: "#667eea20",
                        color: "#667eea",
                        padding: "1px 4px",
                        borderRadius: "2px",
                        fontSize: "10px",
                        fontWeight: "600"
                      }}>
                        {upNextVideo.quality}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save to Playlist Modal */}
      {showPlaylistModal && (
        <SaveToPlaylist
          videoId={videoId}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}
