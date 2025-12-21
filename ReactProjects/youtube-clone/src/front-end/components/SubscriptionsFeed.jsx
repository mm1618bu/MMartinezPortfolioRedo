/**
 * SubscriptionsFeed Component
 * Displays videos from channels the user is subscribed to
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, getSubscribedChannelIds } from '../utils/supabase';

export default function SubscriptionsFeed() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'popular', 'oldest'

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Get subscribed channel IDs
  const { data: subscribedChannelIds = [] } = useQuery({
    queryKey: ['subscribedChannelIds', currentUser?.id],
    queryFn: () => getSubscribedChannelIds(currentUser.id),
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch videos from subscribed channels
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['subscriptionVideos', subscribedChannelIds, sortBy],
    queryFn: async () => {
      if (subscribedChannelIds.length === 0) return [];

      // Get videos from subscribed channels
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .in('channel_id', subscribedChannelIds)
        .order('created_at', { ascending: sortBy === 'oldest' });

      if (error) throw error;

      // Sort by popularity if needed
      if (sortBy === 'popular') {
        return data.sort((a, b) => (b.views || 0) - (a.views || 0));
      }

      return data;
    },
    enabled: subscribedChannelIds.length > 0,
    staleTime: 1000 * 60 * 3,
  });

  if (!currentUser) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Sign In Required</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Please sign in to see videos from your subscriptions.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p>Loading videos from your subscriptions...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            Subscriptions
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: 0
          }}>
            {videos.length} video{videos.length !== 1 ? 's' : ''} from {subscribedChannelIds.length} channel{subscribedChannelIds.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            onClick={() => navigate('/subscriptions')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#667eea',
              border: '1px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#667eea';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
          >
            Manage Subscriptions
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          {subscribedChannelIds.length === 0 ? (
            <>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '12px' }}>
                You haven't subscribed to any channels yet
              </p>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
                Subscribe to channels to see their latest videos here
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Explore Channels
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '12px' }}>
                No videos yet from your subscribed channels
              </p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Check back later for new content!
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/watch/${video.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const uploaded = new Date(dateString);
    const seconds = Math.floor((now - uploaded) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'white',
        transition: 'all 0.2s',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
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
        {video.duration > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '3px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '15px',
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
          {video.channel_name}
        </p>

        <div style={{
          fontSize: '12px',
          color: '#999',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{(video.views || 0).toLocaleString()} views</span>
          <span>•</span>
          <span>{formatTimeAgo(video.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
