/**
 * HomeFeed Component
 * Displays personalized video feed with infinite scroll
 * Enhanced with history-based recommendations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
  getHomeFeed, 
  getUserPreferences, 
  trackInteraction,
  VIDEO_CATEGORIES,
  refreshTrendingVideos
} from '../utils/homeFeedAPI';
import { 
  getHistoryBasedRecommendations,
  getRecommendationReason
} from '../utils/historyBasedRecommendations';
import { supabase } from '../utils/supabase';

const HomeFeed = () => {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [feedType, setFeedType] = useState('for-you'); // for-you, trending, subscriptions
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: () => getUserPreferences(user.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Infinite scroll for videos with history-based personalization
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['homeFeed', user?.id, selectedCategory, feedType],
    queryFn: async ({ pageParam = 0 }) => {
      // Use history-based recommendations for personalized feed
      if (feedType === 'for-you' && user?.id) {
        const watchedVideoIds = data?.pages?.flatMap(page => 
          page.videos.map(v => v.id)
        ) || [];
        
        const videos = await getHistoryBasedRecommendations(
          user.id, 
          20, 
          watchedVideoIds
        );
        
        return {
          videos,
          nextOffset: pageParam + 20,
          isPersonalized: true,
        };
      }
      
      // Fallback to original feed for trending/other types
      const videos = await getHomeFeed(user?.id, 20, pageParam);
      return {
        videos,
        nextOffset: pageParam + 20,
        isPersonalized: false,
      };
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.videos.length < 20) return undefined;
      return lastPage.nextOffset;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    observerRef.current = observer;

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Track video view
  const handleVideoClick = useCallback(async (videoId) => {
    if (user) {
      await trackInteraction(user.id, videoId, 'view');
    }
  }, [user]);

  // Refresh trending videos periodically (every 15 minutes)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshTrendingVideos();
    }, 15 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format view count
  const formatViews = (views) => {
    if (!views) return '0 views';
    if (views < 1000) return `${views} views`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
    return `${(views / 1000000).toFixed(1)}M views`;
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  };

  // Get all videos from pages
  const allVideos = data?.pages?.flatMap(page => page.videos) || [];

  if (isLoading) {
    return (
      <div className="home-feed">
        <div className="feed-header">
          <h1>Home</h1>
        </div>
        <div className="feed-loading">
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-video-card">
                <div className="skeleton-thumbnail"></div>
                <div className="skeleton-info">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="home-feed">
        <div className="feed-error">
          <h2>Unable to load feed</h2>
          <p>{error?.message || 'Something went wrong'}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-feed">
      {/* Feed Header */}
      <div className="feed-header">
        <h1>Home</h1>
        
        {/* Feed Type Selector */}
        <div className="feed-type-tabs">
          <button
            className={feedType === 'for-you' ? 'active' : ''}
            onClick={() => setFeedType('for-you')}
          >
            For You
          </button>
          <button
            className={feedType === 'trending' ? 'active' : ''}
            onClick={() => setFeedType('trending')}
          >
            Trending
          </button>
          {user && (
            <button
              className={feedType === 'subscriptions' ? 'active' : ''}
              onClick={() => setFeedType('subscriptions')}
            >
              Subscriptions
            </button>
          )}
        </div>
      </div>

      {/* Category Chips */}
      <div className="category-chips">
        <button
          className={`chip ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {VIDEO_CATEGORIES.slice(0, 12).map(category => (
          <button
            key={category}
            className={`chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* User Preferences Banner */}
      {user && preferences && (
        <div className="preferences-banner">
          <div className="pref-info">
            <span className="pref-icon">🎯</span>
            <span>
              Personalized for you
              {preferences.preferred_categories?.length > 0 && (
                <> • {preferences.preferred_categories.length} favorite categories</>
              )}
            </span>
          </div>
          <button 
            className="edit-prefs-btn"
            onClick={() => window.location.href = '/settings/preferences'}
          >
            Edit Preferences
          </button>
        </div>
      )}

      {/* Video Grid */}
      <div className="video-grid">
        {allVideos.length === 0 ? (
          <div className="empty-feed">
            <h3>No videos found</h3>
            <p>Try adjusting your preferences or check back later</p>
          </div>
        ) : (
          allVideos.map((video) => (
            <div key={video.id} className="video-card">
              <a
                href={`/watch?v=${video.id}`}
                className="video-thumbnail-link"
                onClick={() => handleVideoClick(video.id)}
              >
                <div className="video-thumbnail">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <span className="play-icon">▶</span>
                    </div>
                  )}
                  {video.duration && (
                    <span className="video-duration">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  {video.quality && (
                    <span className="video-quality-badge">{video.quality}</span>
                  )}
                </div>
              </a>

              <div className="video-info">
                <a href={`/watch?v=${video.id}`} onClick={() => handleVideoClick(video.id)}>
                  <h3 className="video-title">{video.title}</h3>
                </a>
                
                <div className="video-metadata">
                  <a href={`/channel/${video.channel_name}`} className="channel-name">
                    {video.channel_name || 'Unknown Channel'}
                  </a>
                  
                  <div className="video-stats">
                    <span>{formatViews(video.views)}</span>
                    <span className="dot-separator">•</span>
                    <span>{formatTimeAgo(video.created_at)}</span>
                  </div>

                  {/* Show personalized score or recommendation reason */}
                  {video.personalizedScore && user && (
                    <div className="personalized-badge" title={getRecommendationReason(video, preferences)}>
                      <span className="badge-icon">✨</span>
                      <span className="badge-text">
                        {getRecommendationReason(video, preferences)}
                      </span>
                    </div>
                  )}
                  
                  {video.recommendation_score && !video.personalizedScore && (
                    <div className="recommendation-badge" title="Recommended for you">
                      ⭐ {Math.round(video.recommendation_score)}
                    </div>
                  )}
                </div>

                {video.description && (
                  <p className="video-description">
                    {video.description.slice(0, 100)}
                    {video.description.length > 100 && '...'}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {isFetchingNextPage && (
          <div className="loading-more">
            <div className="spinner"></div>
            <p>Loading more videos...</p>
          </div>
        )}
        {!hasNextPage && allVideos.length > 0 && (
          <div className="end-of-feed">
            <p>You've reached the end</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeFeed;
