# Video Reactions & Channel Subscriptions API

This document describes the new APIs for handling video reactions (like/dislike) and channel subscriptions.

## Database Setup

Run the migration file to create the required tables:

```sql
-- Run the migration in Supabase SQL Editor
-- File: database/migrations/add_reactions_and_subscriptions.sql
```

### Tables Created:

1. **video_reactions** - Tracks user likes/dislikes on videos
   - `id` - Primary key
   - `user_id` - References auth.users
   - `video_id` - References videos table
   - `reaction_type` - 'like' or 'dislike'
   - `created_at`, `updated_at` - Timestamps
   - Unique constraint on (user_id, video_id) - one reaction per user per video

2. **subscriptions** - Tracks channel subscriptions
   - `id` - Primary key
   - `user_id` - References auth.users
   - `channel_id` - References channels table
   - `created_at` - Timestamp
   - Unique constraint on (user_id, channel_id) - one subscription per user per channel

## Video Reactions API

### Get User's Reaction for a Video
```javascript
import { getUserVideoReaction } from './utils/supabase';

const reaction = await getUserVideoReaction(userId, videoId);
// Returns: { reaction_type: 'like' | 'dislike', ... } or null
```

### Set Video Reaction (Like/Dislike)
```javascript
import { setVideoReaction } from './utils/supabase';

// Like a video
const result = await setVideoReaction(userId, videoId, 'like');
// Returns: { action: 'added' | 'removed' | 'updated', reactionType: 'like' | 'dislike' }

// Dislike a video
const result = await setVideoReaction(userId, videoId, 'dislike');

// Clicking the same reaction again removes it (toggle behavior)
```

### Get Video Reaction Counts
```javascript
import { getVideoReactionCounts } from './utils/supabase';

const counts = await getVideoReactionCounts(videoId);
// Returns: { likes: number, dislikes: number }
```

### Remove Video Reaction
```javascript
import { removeVideoReaction } from './utils/supabase';

await removeVideoReaction(userId, videoId);
```

## Channel Subscriptions API

### Check if Subscribed
```javascript
import { isSubscribedToChannel } from './utils/supabase';

const subscribed = await isSubscribedToChannel(userId, channelId);
// Returns: boolean
```

### Subscribe to Channel
```javascript
import { subscribeToChannel } from './utils/supabase';

const result = await subscribeToChannel(userId, channelId);
// Returns: { action: 'subscribed' | 'already_subscribed', subscribed: true }
```

### Unsubscribe from Channel
```javascript
import { unsubscribeFromChannel } from './utils/supabase';

const result = await unsubscribeFromChannel(userId, channelId);
// Returns: { action: 'unsubscribed', subscribed: false }
```

### Get Subscriber Count
```javascript
import { getSubscriberCount } from './utils/supabase';

const count = await getSubscriberCount(channelId);
// Returns: number
```

### Get User's Subscriptions
```javascript
import { getUserSubscriptions } from './utils/supabase';

const subscriptions = await getUserSubscriptions(userId);
// Returns: Array of subscription objects with channel details
```

### Get Subscribed Channel IDs
```javascript
import { getSubscribedChannelIds } from './utils/supabase';

const channelIds = await getSubscribedChannelIds(userId);
// Returns: Array of channel IDs
```

## Example Usage in Components

### Video Player with Like/Dislike
```javascript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserVideoReaction, 
  setVideoReaction, 
  getVideoReactionCounts 
} from '../utils/supabase';

function VideoPlayer({ videoId, userId }) {
  const queryClient = useQueryClient();
  
  // Get user's current reaction
  const { data: userReaction } = useQuery({
    queryKey: ['videoReaction', userId, videoId],
    queryFn: () => getUserVideoReaction(userId, videoId),
    enabled: !!userId && !!videoId,
  });

  // Get reaction counts
  const { data: counts } = useQuery({
    queryKey: ['videoReactionCounts', videoId],
    queryFn: () => getVideoReactionCounts(videoId),
    enabled: !!videoId,
  });

  // Mutation for setting reaction
  const reactionMutation = useMutation({
    mutationFn: ({ reactionType }) => setVideoReaction(userId, videoId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries(['videoReaction', userId, videoId]);
      queryClient.invalidateQueries(['videoReactionCounts', videoId]);
    },
  });

  const handleLike = () => {
    reactionMutation.mutate({ reactionType: 'like' });
  };

  const handleDislike = () => {
    reactionMutation.mutate({ reactionType: 'dislike' });
  };

  return (
    <div>
      <button 
        onClick={handleLike}
        className={userReaction?.reaction_type === 'like' ? 'active' : ''}
      >
        👍 {counts?.likes || 0}
      </button>
      <button 
        onClick={handleDislike}
        className={userReaction?.reaction_type === 'dislike' ? 'active' : ''}
      >
        👎 {counts?.dislikes || 0}
      </button>
    </div>
  );
}
```

### Channel Subscribe Button
```javascript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  isSubscribedToChannel, 
  subscribeToChannel, 
  unsubscribeFromChannel,
  getSubscriberCount 
} from '../utils/supabase';

function SubscribeButton({ channelId, userId }) {
  const queryClient = useQueryClient();
  
  // Check subscription status
  const { data: isSubscribed } = useQuery({
    queryKey: ['subscription', userId, channelId],
    queryFn: () => isSubscribedToChannel(userId, channelId),
    enabled: !!userId && !!channelId,
  });

  // Get subscriber count
  const { data: subscriberCount } = useQuery({
    queryKey: ['subscriberCount', channelId],
    queryFn: () => getSubscriberCount(channelId),
    enabled: !!channelId,
  });

  // Mutation for subscribe/unsubscribe
  const subscribeMutation = useMutation({
    mutationFn: () => {
      if (isSubscribed) {
        return unsubscribeFromChannel(userId, channelId);
      } else {
        return subscribeToChannel(userId, channelId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription', userId, channelId]);
      queryClient.invalidateQueries(['subscriberCount', channelId]);
    },
  });

  return (
    <div>
      <button onClick={() => subscribeMutation.mutate()}>
        {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      </button>
      <span>{subscriberCount || 0} subscribers</span>
    </div>
  );
}
```

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### video_reactions:
- Anyone can view reactions (for displaying counts)
- Users can only add/update/delete their own reactions

### subscriptions:
- Anyone can view subscriptions (for displaying subscriber counts)
- Users can only subscribe/unsubscribe for themselves

## Notes

- Each user can only have ONE reaction per video (enforced by unique constraint)
- Clicking the same reaction button toggles it (removes the reaction)
- Each user can only subscribe once to a channel (enforced by unique constraint)
- All operations are protected by RLS policies
- Cascading deletes are enabled (deleting a user/video/channel removes related records)
