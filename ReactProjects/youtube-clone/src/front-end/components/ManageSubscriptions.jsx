/**
 * ManageSubscriptions Component
 * Allows users to view and manage all their channel subscriptions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserSubscriptions, 
  unsubscribeFromChannel, 
  supabase,
  getSubscriberCount 
} from '../utils/supabase';

export default function ManageSubscriptions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'alphabetical', 'subscribers'
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch user subscriptions with channel details
  const { data: subscriptions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userSubscriptions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      // Get subscriptions with channel info
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          channels (
            channel_id,
            channel_tag,
            channel_name,
            description,
            user_id
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get subscriber counts for each channel
      const withCounts = await Promise.all(
        data.map(async (sub) => {
          const count = await getSubscriberCount(sub.channel_id);
          return {
            ...sub,
            subscriberCount: count,
          };
        })
      );

      return withCounts;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: ({ channelId }) => unsubscribeFromChannel(currentUser.id, channelId),
    onSuccess: () => {
      queryClient.invalidateQueries(['userSubscriptions', currentUser?.id]);
    },
  });

  // Handle unsubscribe
  const handleUnsubscribe = async (channelId, channelName) => {
    if (window.confirm(`Unsubscribe from ${channelName}?`)) {
      try {
        await unsubscribeMutation.mutateAsync({ channelId });
      } catch (error) {
        console.error('Error unsubscribing:', error);
        alert('Failed to unsubscribe. Please try again.');
      }
    }
  };

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = React.useMemo(() => {
    let filtered = subscriptions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.channels?.channel_name?.toLowerCase().includes(query) ||
        sub.channels?.channel_tag?.toLowerCase().includes(query) ||
        sub.channels?.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        return [...filtered].sort((a, b) => 
          (a.channels?.channel_name || '').localeCompare(b.channels?.channel_name || '')
        );
      case 'subscribers':
        return [...filtered].sort((a, b) => 
          (b.subscriberCount || 0) - (a.subscriberCount || 0)
        );
      case 'recent':
      default:
        return filtered;
    }
  }, [subscriptions, sortBy, searchQuery]);

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
          Please sign in to manage your subscriptions.
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
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p>Loading your subscriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#dc3545' }}>Error loading subscriptions: {error.message}</p>
        <button onClick={() => refetch()} style={{
          marginTop: '16px',
          padding: '8px 16px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0 0 8px 0'
        }}>
          Manage Subscriptions
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0
        }}>
          {subscriptions.length} channel{subscriptions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1',
            minWidth: '250px',
            padding: '10px 16px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
        />

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="recent">Most Recent</option>
          <option value="alphabetical">A-Z</option>
          <option value="subscribers">Most Subscribers</option>
        </select>
      </div>

      {/* Subscriptions List */}
      {filteredAndSortedSubscriptions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          {searchQuery ? (
            <>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                No subscriptions found for "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '12px' }}>
                You haven't subscribed to any channels yet
              </p>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
                Start exploring and subscribe to channels you love!
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
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredAndSortedSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onUnsubscribe={handleUnsubscribe}
              onViewChannel={() => navigate(`/channel/${subscription.channels?.channel_tag}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({ subscription, onUnsubscribe, onViewChannel }) {
  const channel = subscription.channels;
  const [isHovered, setIsHovered] = useState(false);

  if (!channel) {
    return null;
  }

  const subscribedDate = new Date(subscription.created_at);
  const formattedDate = subscribedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.2s',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      {/* Channel Avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          color: 'white',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          {channel.channel_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div style={{ marginLeft: '16px', flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {channel.channel_name}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#666'
          }}>
            @{channel.channel_tag}
          </p>
        </div>
      </div>

      {/* Subscriber Count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <span>👥</span>
        <span>{(subscription.subscriberCount || 0).toLocaleString()} subscribers</span>
      </div>

      {/* Subscribed Date */}
      <p style={{
        fontSize: '12px',
        color: '#999',
        marginBottom: '16px'
      }}>
        Subscribed on {formattedDate}
      </p>

      {/* Description */}
      {channel.description && (
        <p style={{
          fontSize: '13px',
          color: '#666',
          lineHeight: '1.5',
          marginBottom: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {channel.description}
        </p>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: 'auto'
      }}>
        <button
          onClick={onViewChannel}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
        >
          View Channel
        </button>
        <button
          onClick={() => onUnsubscribe(channel.channel_id, channel.channel_name)}
          style={{
            padding: '10px 16px',
            backgroundColor: 'white',
            color: '#dc3545',
            border: '1px solid #dc3545',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc3545';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = '#dc3545';
          }}
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
}
