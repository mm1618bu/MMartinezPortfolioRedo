import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVideoFromSupabase, updateVideoInSupabase } from '../utils/supabase';
import { throttle } from '../utils/rateLimiting';
import CommentFeed from './CommentFeed.jsx';
import RecomendationBar from "./RecomendationBar.jsx";
import AddToPlaylistModal from './AddToPlaylistModal.jsx';

export default function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [timeAgo, setTimeAgo] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userReaction, setUserReaction] = useState(null); // 'like', 'dislike', or null
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

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
      console.log('✅ Reaction updated in database');
    },
    onError: (error) => {
      console.error('❌ Error updating reaction:', error);
    },
  });

  // Increment views on mount
  useEffect(() => {
    if (video) {
      incrementViewsMutation.mutate();
    }
  }, [video?.id]);

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
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#d32f2f" }}>
        <p>Error: {error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px" }}>
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

      {/* Video Player */}
      <div style={{ 
        backgroundColor: "#000", 
        borderRadius: "8px", 
        overflow: "hidden",
        marginBottom: "20px"
      }}>
        <video
          controls
          autoPlay
          style={{
            width: "100%",
            maxHeight: "720px",
            display: "block"
          }}
          src={video?.video_url}
          poster={video?.thumbnail_url}
          onError={(e) => console.error("❌ Video playback error:", e)}
        />
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
            color: "#666"
          }}>
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span>{timeAgo}</span>
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

        {/* Keywords/Tags */}
        {video.keywords && video.keywords.length > 0 && (
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "8px",
            marginBottom: "16px"
          }}>
            {video.keywords.map((keyword, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: "#e0e0e0",
                  color: "#333",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {video.description && (
          <div style={{
            backgroundColor: "#f9f9f9",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0"
          }}>
            <p style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#333",
              whiteSpace: "pre-wrap"
            }}>
              {video.description}
            </p>
          </div>
        )}
        
        {/* Comments Section */}
        
        <CommentFeed videoId={videoId} />
        <RecomendationBar videoId={videoId} />
      </div>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <AddToPlaylistModal
          videoId={videoId}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}
