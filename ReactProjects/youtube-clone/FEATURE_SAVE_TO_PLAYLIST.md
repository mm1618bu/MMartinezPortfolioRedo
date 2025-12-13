# Save to Playlist & Watch Later Feature

## Overview
Added the ability to save videos to playlists and a "Watch Later" feature for quick video saving.

## Features Implemented

### 1. **Watch Later**
- Automatically creates a "Watch Later" private playlist for each user
- Quick toggle to add/remove videos from Watch Later
- Identified with 🕒 clock icon

### 2. **Save to Playlist**
- Modal showing all user's playlists
- Checkboxes indicate which playlists contain the video
- Click to add/remove video from playlists
- Shows playlist privacy status (🌐 Public / 🔒 Private)

### 3. **Create New Playlist**
- Inline playlist creation from the save modal
- Option to make playlist public or private
- Automatically adds the video to newly created playlist

## New API Functions (supabase.js)

```javascript
// Check if video is in a playlist
isVideoInPlaylist(playlistId, videoId)

// Watch Later functions
getOrCreateWatchLaterPlaylist(userId, channelName)
addToWatchLater(userId, videoId, channelName)
removeFromWatchLater(userId, videoId)
isInWatchLater(userId, videoId)
```

## Components

### SaveToPlaylist.jsx
- Modal component for saving videos
- Handles Watch Later toggle
- Shows user's playlists with checkboxes
- Inline playlist creation form
- React Query integration for real-time updates

## How to Use

### In Video Player:
1. Click the "Save" or "Add to Playlist" button
2. Modal opens with options:
   - **Watch Later** (click to toggle)
   - List of your playlists (check/uncheck to add/remove)
   - **+ Create new playlist** button at bottom

### Creating Playlists:
1. Click "+ Create new playlist"
2. Enter playlist name
3. Check "Private" if you want it private (default is public)
4. Click "Create" - video is automatically added

### Watch Later:
- One-click save to Watch Later
- Access Watch Later from your playlists page
- Private by default

## Styling

Added comprehensive CSS in `main.css`:
- `.save-to-playlist-*` classes for modal and components
- Responsive design
- Hover effects and transitions
- Checkbox styling
- Form inputs and buttons

## Integration

The SaveToPlaylist component is integrated in:
- **VideoPlayer.jsx** - "Save" button in video controls

Can also be added to:
- Video cards in search results
- Video cards in channel pages
- Recommendation sidebar
- Any component displaying videos

### Example Integration:
```javascript
import SaveToPlaylist from './SaveToPlaylist';

function YourComponent() {
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowSaveModal(true)}>
        Save
      </button>
      
      {showSaveModal && (
        <SaveToPlaylist 
          videoId={videoId} 
          onClose={() => setShowSaveModal(false)} 
        />
      )}
    </>
  );
}
```

## Notes

- Requires user to be logged in
- Uses React Query for caching and real-time updates
- Prevents duplicate saves (shows checkmark if already in playlist)
- Watch Later playlist is automatically created on first use
- All playlist operations are instant with optimistic updates
