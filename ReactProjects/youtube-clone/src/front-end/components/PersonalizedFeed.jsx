/**
 * PersonalizedFeed Component
 * Displays personalized video recommendations based on user interests
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllVideosFromSupabase } from '../utils/supabase';
import {
  getPersonalizedRecommendations,
  getTrendingRecommendations,
  getForYouRecommendations,
  getColdStartRecommendations,
  getUserProfile,
  getTopInterests,
  getRecommendationReason,
} from '../utils/recommendationModel';

export default function PersonalizedFeed() {
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState('for-you'); // 'for-you', 'trending', 'all'
  
  // Fetch all videos
  const { data: allVideos = [], isLoading } = useQuery({
    queryKey: ['allVideos'],
    queryFn: getAllVideosFromSupabase,
    staleTime: 1000 * 60 * 10,
  });

  // Get user profile for personalization info
  const userProfile = getUserProfile();
  const hasHistory = userProfile.watchedVideos.length > 0;
  const topInterests = getTopInterests(5);

  // Get personalized recommendations based on feed type
  const recommendations = useMemo(() => {
    if (!allVideos.length) return [];

    switch (feedType) {
      case 'for-you':
        return hasHistory 
          ? getForYouRecommendations(allVideos, 30)
          : getColdStartRecommendations(allVideos, 30);
      case 'trending':
        return getTrendingRecommendations(allVideos, 30);
      case 'all':
        return getColdStartRecommendations(allVideos, 30);
      default:
        return getPersonalizedRecommendations(allVideos, { limit: 30 });
    }
  }, [allVideos, feedType, hasHistory]);

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Feed Type Selector */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setFeedType('for-you')}
          style={{
            padding: '8px 16px',
            backgroundColor: feedType === 'for-you' ? '#667eea' : 'transparent',
            color: feedType === 'for-you' ? 'white' : '#333',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          For You
        </button>
        <button
          onClick={() => setFeedType('trending')}
          style={{
            padding: '8px 16px',
            backgroundColor: feedType === 'trending' ? '#667eea' : 'transparent',
            color: feedType === 'trending' ? 'white' : '#333',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          🔥 Trending
        </button>
        <button
          onClick={() => setFeedType('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: feedType === 'all' ? '#667eea' : 'transparent',
            color: feedType === 'all' ? 'white' : '#333',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          All Videos
        </button>
      </div>

      {/* User Interests Display */}
      {hasHistory && feedType === 'for-you' && topInterests.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
            Based on your interests:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {topInterests.map(({ keyword, score }) => (
              <span
                key={keyword}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#667eea20',
                  color: '#667eea',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {keyword} ({score})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {recommendations.map((video) => (
          <VideoRecommendationCard
            key={video.id}
            video={video}
            onClick={() => navigate(`/watch/${video.id}`)}
            showReason={feedType === 'for-you'}
          />
        ))}
      </div>

      {recommendations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <p>No videos available yet.</p>
        </div>
      )}
    </div>
  );
}

function VideoRecommendationCard({ video, onClick, showReason }) {
  const reason = showReason ? getRecommendationReason(video) : null;

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%',
        backgroundColor: '#e0e0e0'
      }}>
        <img
          src={video.thumbnail_url || 'https://placehold.co/320x180?text=No+Thumbnail'}
          alt={video.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* Recommendation scores (debug) */}
        {video.interestScore > 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {video.recommendationScore?.toFixed(0) || video.combinedScore?.toFixed(0) || '—'}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: '600',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {video.title}
        </h3>

        <p style={{
          margin: '0 0 8px 0',
          fontSize: '13px',
          color: '#666'
        }}>
          {video.channel_name || 'Unknown Channel'}
        </p>

        <div style={{
          fontSize: '12px',
          color: '#999',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span>{(video.views || 0).toLocaleString()} views</span>
          {video.quality && (
            <>
              <span>•</span>
              <span>{video.quality}</span>
            </>
          )}
        </div>

        {/* Recommendation reason */}
        {showReason && reason && (
          <div style={{
            fontSize: '11px',
            color: '#667eea',
            backgroundColor: '#667eea10',
            padding: '6px 8px',
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            {reason}
          </div>
        )}
      </div>
    </div>
  );
}
