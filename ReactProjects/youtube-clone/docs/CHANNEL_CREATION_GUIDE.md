# Channel Creation System - Setup Guide

## Overview
A complete channel creation system that allows users to optionally create channels during registration or later from their profile. **Updated to work with your existing channels table schema.**

## Database Setup

### Your Existing Channels Table Schema
```sql
create table public.channels (
  channel_id integer not null,
  channel_name character varying(255) null,
  channel_tag character varying(100) null,
  channel_description character varying(200) null,
  user_id integer null,
  constraint channels_pkey primary key (channel_id),
  constraint channels_user_id_fkey foreign KEY (user_id) references users (user_id)
);
```

### 1. Update Your Schema to Work with Supabase Auth
**IMPORTANT:** Your current schema uses `user_id integer`, but Supabase Auth uses UUIDs. Run `update_channels_for_auth.sql` in your Supabase SQL Editor to:
- Convert `user_id` from integer to UUID
- Link to Supabase Auth users (`auth.users`)
- Add unique constraints (one channel per user, unique channel_tag)
- Set up RLS policies for secure access
- Add timestamps (created_at, updated_at)
- Create indexes for performance

```sql
-- The file updates:
-- - user_id: integer → UUID (linked to auth.users)
-- - Adds unique constraints on user_id and channel_tag
-- - RLS policies (users can only manage their own channels)
-- - Triggers for auto-updating timestamps
-- - Indexes for query performance
```

## Features

### Registration Flow
1. **User registers** with email and password
2. **Choice screen** appears: "Do you want to create a channel?"
   - **Yes** → Goes to channel creation form
   - **No** → Completes registration as regular user
3. **Email confirmation** required for both paths

### Channel Creation Form
- **Channel Tag/Handle** (@username)
  - 3-100 characters (stored in `channel_tag` column)
  - Lowercase letters, numbers, hyphens, underscores only
  - Real-time availability checking
  - Shows ✓ available or ✗ taken
  - Must be unique across all channels
  
- **Channel Name** 
  - How the channel appears to viewers (stored in `channel_name` column)
  - Up to 255 characters
  - Can include spaces and special characters
  - This is the display name shown to users
  
- **Channel Description** (optional)
  - Tell viewers about your channel (stored in `channel_description` column)
  - Up to 200 characters
  - Character counter included

### User Types
- **Regular Users**: Can browse, like, comment, save playlists
- **Channel Owners**: All regular features PLUS upload videos

### Routes
- `/` - Home page (registration/login)
- `/channel/create` - Standalone channel creation (for logged-in users)
- Registration flow automatically handles channel creation

## Backend Functions (supabase.js)

```javascript
// Channel CRUD operations (updated for your schema)
createChannel(channelData)           // Create new channel
  // channelData: { user_id, channel_tag, channel_name, channel_description }
  
getChannelByUserId(userId)           // Get user's channel by UUID
getChannelByTag(channelTag)          // Find channel by @handle (renamed from getChannelByName)
updateChannel(channelId, updates)    // Update channel info (uses channel_id)
deleteChannel(channelId)             // Remove channel (uses channel_id)
isChannelTagAvailable(channelTag)    // Check if @handle is free (renamed)
getCurrentUserChannel()              // Get logged-in user's channel
```

### Schema Mapping
- `channel_tag` = Unique handle like @mychannel (100 chars max)
- `channel_name` = Display name like "My Awesome Channel" (255 chars max)
- `channel_description` = Optional description (200 chars max)
- `user_id` = UUID from Supabase Auth
- `channel_id` = Integer primary key (auto-generated)

## Component Structure

### CreateChannel.jsx
- Standalone channel creation component
- Props:
  - `onChannelCreated`: Callback when channel is created
  - `skipable`: Boolean to show/hide skip button
- Features:
  - Real-time name availability checking
  - Form validation
  - User authentication check
  - React Query mutations

### RegisterPage.jsx
- Enhanced registration flow
- Three states:
  1. Initial registration form
  2. Channel choice screen
  3. Channel creation (if chosen)
- Seamless integration with CreateChannel component

## Security Features

### Row Level Security (RLS)
- ✅ Anyone can view public channels
- ✅ Users can only create ONE channel (unique constraint)
- ✅ Users can only update/delete their OWN channel
- ✅ Channel linked to auth.users via user_id

### Validation
- Email format validation
- Password requirements (handled by Supabase Auth)
- Channel name format validation (regex pattern)
- Unique channel name enforcement
- User must be authenticated to create channel

## Usage Examples

### Creating a Channel at Registration
1. User fills registration form
2. Clicks "Register"
3. Sees success message with choice buttons
4. Clicks "Yes, Create a Channel"
5. Fills channel form:
   - Channel Tag: @myhandle (stored in `channel_tag`)
   - Channel Name: "My Awesome Channel" (stored in `channel_name`)
   - Description: Optional text (stored in `channel_description`)
6. System checks tag availability in real-time
7. Clicks "Create Channel"
8. Redirected to home with success message

### Creating a Channel Later
1. User logs in as regular user
2. Navigates to `/channel/create`
3. Fills channel creation form
4. Channel created and linked to their account

### Checking if User Has a Channel
```javascript
import { getCurrentUserChannel } from './utils/supabase';

const channel = await getCurrentUserChannel();
if (channel) {
  console.log('User has channel:', channel.channel_name);
} else {
  console.log('User has no channel');
}
```

## Styling

### Key CSS Classes
- `.create-channel-container` - Full-page gradient background
- `.create-channel-card` - White card with form
- `.channel-name-input-wrapper` - @ prefix input styling
- `.availability-message` - Real-time name checking feedback
- `.channel-choice-buttons` - Registration choice buttons
- Responsive design for mobile devices

### Color Scheme
- Primary gradient: Purple (#667eea) to Purple (#764ba2)
- Success: Green (#2e7d32)
- Error: Red (#c62828)
- Neutral: Grays for text and borders

## Future Enhancements
- Profile image upload for channels
- Banner image upload
- Channel analytics dashboard
- Subscriber management
- Channel verification badges
- Custom channel URLs
- Channel categories/tags

## Testing Checklist
- [ ] **Run `update_channels_for_auth.sql` in Supabase SQL Editor** (CRITICAL!)
- [ ] Verify user_id column is now UUID type
- [ ] Register new user
- [ ] Choose "Create Channel" option
- [ ] Test channel tag availability checker (@myhandle)
- [ ] Create channel with valid data (tag, name, description)
- [ ] Verify channel appears in database with correct columns
- [ ] Test "Skip" option during registration
- [ ] Try creating second channel with same user (should fail - unique constraint)
- [ ] Try creating channel with duplicate @tag (should fail - unique constraint)
- [ ] Navigate to `/channel/create` while logged in
- [ ] Test all form validations (character limits, format validation)
- [ ] Verify RLS policies work (users can only edit their own channel)
