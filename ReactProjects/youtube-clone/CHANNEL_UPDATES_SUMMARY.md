# Channel System - Updated for Existing Schema

## What Changed

Your existing `channels` table has been adapted to work with Supabase Auth and the new channel creation system.

## Database Schema Changes

### Before (Your Original Schema)
```sql
create table public.channels (
  channel_id integer not null,
  channel_name character varying(255) null,    -- Display name
  channel_tag character varying(100) null,      -- @handle
  channel_description character varying(200) null,
  user_id integer null,                          -- Integer FK
  constraint channels_pkey primary key (channel_id),
  constraint channels_user_id_fkey foreign KEY (user_id) references users (user_id)
);
```

### After Running `update_channels_for_auth.sql`
```sql
create table public.channels (
  channel_id integer not null,
  channel_name character varying(255) not null,  -- Display name
  channel_tag character varying(100) not null,    -- @handle (UNIQUE)
  channel_description character varying(200) null,
  user_id uuid not null,                          -- UUID FK to auth.users
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint channels_pkey primary key (channel_id),
  constraint channels_user_id_fkey foreign KEY (user_id) references auth.users(id) ON DELETE CASCADE,
  constraint unique_user_channel UNIQUE(user_id),  -- One channel per user
  constraint unique_channel_tag UNIQUE(channel_tag) -- Unique @handles
);
```

## Function Name Changes

Updated function names to match your schema:

| Old Function Name | New Function Name | Purpose |
|-------------------|-------------------|---------|
| `isChannelNameAvailable()` | `isChannelTagAvailable()` | Check if @handle is available |
| `getChannelByName()` | `getChannelByTag()` | Get channel by @handle |

## Field Mapping

| What User Sees | Database Column | Example | Max Length |
|----------------|-----------------|---------|------------|
| Channel Handle | `channel_tag` | `@mychannel` | 100 chars |
| Channel Name | `channel_name` | `My Awesome Channel` | 255 chars |
| Description | `channel_description` | `Gaming videos...` | 200 chars |

## Component Updates

### CreateChannel.jsx
- Changed state from `channelName/displayName` to `channelTag/channelName`
- Uses `isChannelTagAvailable()` for real-time checking
- Sends data as: `{ user_id, channel_tag, channel_name, channel_description }`
- Form label now says "Channel Handle" for the @username field
- Character limit updated to 100 for tag, 255 for name, 200 for description

### supabase.js Functions
All channel functions now use correct column names:
- Insert: `channel_tag`, `channel_name`, `channel_description`
- Queries: `.eq('channel_id', ...)` or `.eq('channel_tag', ...)`
- Returns: Full channel object with all columns

## RLS Policies

The SQL update adds comprehensive Row Level Security:
- ✅ Public can read all channels
- ✅ Authenticated users can create ONE channel
- ✅ Users can only update/delete their OWN channel
- ✅ Enforced at database level via `auth.uid()`

## Required SQL Execution Order

1. **Run `update_channels_for_auth.sql` in Supabase SQL Editor**
   - This converts your existing table to work with UUID user IDs
   - Adds all necessary constraints and indexes
   - Sets up RLS policies

## Data Structure Example

When a channel is created:
```javascript
{
  channel_id: 1,                           // Auto-generated
  user_id: "a1b2c3d4-...",                // Supabase Auth UUID
  channel_tag: "techreviews",              // Unique @handle
  channel_name: "Tech Reviews Pro",        // Display name
  channel_description: "Latest tech...",   // Optional description
  created_at: "2025-12-07T...",
  updated_at: "2025-12-07T..."
}
```

## Key Constraints

1. **One Channel Per User**: `UNIQUE(user_id)`
   - Each user can only create ONE channel
   - Attempting to create a second channel will fail

2. **Unique Handles**: `UNIQUE(channel_tag)`
   - Each @handle must be unique across all channels
   - Real-time availability checking prevents conflicts

3. **User Ownership**: `user_id → auth.users(id)`
   - Channels are linked to Supabase Auth accounts
   - When auth user is deleted, their channel is deleted (CASCADE)

## Testing Your Updates

1. Run `update_channels_for_auth.sql` in Supabase
2. Check that `user_id` column is now UUID type
3. Register a new user
4. Create a channel with @handle, name, and description
5. Verify in Supabase database table
6. Try to create another channel (should fail - unique constraint)
7. Try to use same @handle (should fail - unique constraint)

## What's NOT Changed

- Primary key still `channel_id` (integer, auto-incrementing)
- All existing column names preserved
- Only changed: `user_id` type and added constraints/indexes
