# Autoplay Toggle - Quick Reference

## Implementation Summary

### Files Changed
1. **VideoPlayer.jsx** - Added autoplay toggle UI and logic
2. **compressionUtils.js** - Exported preference functions
3. **add_autoplay_preference.sql** - Database migration

### Key Functions

#### State Management
```javascript
const [autoplay, setAutoplay] = useState(() => {
  const stored = localStorage.getItem('videoAutoplay');
  return stored !== null ? stored === 'true' : true;
});
const [showAutoplayMenu, setShowAutoplayMenu] = useState(false);
```

#### Toggle Handler
```javascript
const handleAutoplayToggle = async () => {
  const newAutoplay = !autoplay;
  setAutoplay(newAutoplay);
  setShowAutoplayMenu(false);
  
  localStorage.setItem('videoAutoplay', newAutoplay.toString());
  
  if (currentUser) {
    await updateBandwidthPreferences(currentUser.id, {
      autoplay: newAutoplay
    });
  }
};
```

#### Load Preference
```javascript
useEffect(() => {
  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    if (user) {
      const preferences = await getUserBandwidthPreferences(user.id);
      if (preferences?.autoplay !== undefined) {
        setAutoplay(preferences.autoplay);
      }
    }
  };
  fetchUser();
}, []);
```

### Database Schema

```sql
-- Migration: add_autoplay_preference.sql
ALTER TABLE user_bandwidth_preferences 
ADD COLUMN IF NOT EXISTS autoplay BOOLEAN DEFAULT true;
```

### Usage Example

```javascript
// In VideoPlayer component
<video 
  autoPlay={autoplay}  // ← Uses dynamic state instead of hardcoded true
  controls
  src={video?.video_url}
/>
```

### API Reference

#### compressionUtils.js
```javascript
// Get user preferences (includes autoplay)
const prefs = await getUserBandwidthPreferences(userId);
// Returns: { autoplay: boolean, auto_quality: boolean, ... }

// Update autoplay preference
await updateBandwidthPreferences(userId, {
  autoplay: false  // or true
});
```

#### localStorage
```javascript
// Get autoplay setting
const autoplayEnabled = localStorage.getItem('videoAutoplay') === 'true';

// Set autoplay setting
localStorage.setItem('videoAutoplay', 'true');  // or 'false'
```

### UI Component Structure

```jsx
<div style={{ position: "relative" }} data-menu>
  <button onClick={() => setShowAutoplayMenu(!showAutoplayMenu)}>
    {autoplay ? "🔁" : "⏸️"}
    <span>Autoplay</span>
  </button>
  
  {showAutoplayMenu && (
    <div className="autoplay-menu">
      <button onClick={handleAutoplayToggle}>
        <span>{autoplay ? "Turn OFF" : "Turn ON"}</span>
        <span>{autoplay ? "✓" : ""}</span>
      </button>
      <div className="description">
        {autoplay ? "Videos will play automatically" : "Videos require manual play"}
      </div>
    </div>
  )}
</div>
```

## Testing Commands

### Check Database Column
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_bandwidth_preferences' 
  AND column_name = 'autoplay';
```

### Query User Preferences
```sql
SELECT user_id, autoplay, updated_at 
FROM user_bandwidth_preferences 
WHERE user_id = 'YOUR_USER_ID';
```

### Update Manually
```sql
UPDATE user_bandwidth_preferences 
SET autoplay = false 
WHERE user_id = 'YOUR_USER_ID';
```

## Common Issues & Solutions

### Issue: Autoplay not persisting
**Solution**: Check localStorage in DevTools → Application → Local Storage

### Issue: Database not updating
**Solution**: Verify user is logged in and has valid session

### Issue: Menu not closing
**Solution**: Check data-menu attribute and click-outside handler

### Issue: Video still autoplays when OFF
**Solution**: Check browser's autoplay policy restrictions

## Code Locations

```
ReactProjects/youtube-clone/
├── src/front-end/
│   ├── components/
│   │   └── VideoPlayer.jsx          (lines 23-50: state, 105-121: load prefs, 
│   │                                  370-388: toggle handler, 545: video element, 
│   │                                  550-620: UI controls)
│   └── utils/
│       └── compressionUtils.js      (lines 146-177: preference functions)
└── database/migrations/
    └── add_autoplay_preference.sql  (new file)
```

## Feature Flags

To disable autoplay feature temporarily:
```javascript
// In VideoPlayer.jsx
const AUTOPLAY_FEATURE_ENABLED = true;  // Set to false to disable

// Then wrap UI and logic:
{AUTOPLAY_FEATURE_ENABLED && (
  <div>/* Autoplay toggle UI */</div>
)}
```

## Analytics Events

Recommended tracking:
```javascript
// When user toggles autoplay
analytics.track('Autoplay Toggled', {
  enabled: newAutoplay,
  userId: currentUser?.id,
  timestamp: new Date().toISOString()
});
```

## Browser Support

| Browser | Autoplay Support | Toggle Support |
|---------|-----------------|----------------|
| Chrome 66+ | ✅ (with restrictions) | ✅ |
| Firefox 66+ | ✅ | ✅ |
| Safari 11+ | ✅ (muted only) | ✅ |
| Edge 79+ | ✅ | ✅ |
| Mobile Safari | ⚠️ (limited) | ✅ |
| Mobile Chrome | ⚠️ (limited) | ✅ |

## Related Features

- **Playback Speed Control** - Lines 620-650 in VideoPlayer.jsx
- **Quality Control** - Lines 680-730 in VideoPlayer.jsx
- **Bandwidth Preferences** - BandwidthSettings.jsx component

## Deployment Checklist

- [ ] Run database migration
- [ ] Test with logged-in user
- [ ] Test with guest user
- [ ] Test localStorage persistence
- [ ] Test database persistence
- [ ] Verify no console errors
- [ ] Test on mobile
- [ ] Test across browsers
- [ ] Update documentation
- [ ] Notify users of new feature

---

**Created**: December 18, 2025
**Last Updated**: December 18, 2025
**Version**: 1.0.0
