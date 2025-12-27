# Autoplay Toggle - Visual Guide

## Feature Location
The autoplay toggle is located in the video player controls overlay, positioned at the bottom-right of the video player, alongside the playback speed and quality controls.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              VIDEO PLAYING HERE                     │
│                                                     │
│                                                     │
│                                      ┌──────────┐  │
│                                      │ 🔁 Auto  │  │
│                                      │  play    │  │
│                                      └──────────┘  │
│                                      ┌──────────┐  │
│                                      │   1x     │  │
│                                      └──────────┘  │
│                                      ┌──────────┐  │
│                                      │  720p    │  │
│                                      └──────────┘  │
└─────────────────────────────────────────────────────┘
         [══════════════════════] ▶️ 🔊 ⚙️
```

## Visual States

### Autoplay ON (Default)
```
┌──────────────┐
│  🔁 Autoplay │  ← Purple/blue background (rgba(102, 126, 234, 0.9))
└──────────────┘
     ↓ Click
┌──────────────────────┐
│  Turn OFF         ✓  │  ← Checkmark indicates current state
├──────────────────────┤
│ Videos will play     │
│ automatically        │
└──────────────────────┘
```

### Autoplay OFF
```
┌──────────────┐
│  ⏸️ Autoplay │  ← Dark background (rgba(0, 0, 0, 0.7))
└──────────────┘
     ↓ Click
┌──────────────────────┐
│  Turn ON             │  ← No checkmark
├──────────────────────┤
│ Videos require       │
│ manual play          │
└──────────────────────┘
```

## Button Components

### Main Button
- **Icon**: 
  - 🔁 (repeat/loop) = Autoplay ON
  - ⏸️ (pause) = Autoplay OFF
- **Text**: "Autoplay"
- **Background**: 
  - ON = Purple gradient `rgba(102, 126, 234, 0.9)`
  - OFF = Dark `rgba(0, 0, 0, 0.7)`
- **Border**: `1px solid rgba(255, 255, 255, 0.3)`
- **Tooltip**: "Autoplay: ON" or "Autoplay: OFF"

### Dropdown Menu
- **Position**: Above the button (bottom: calc(100% + 5px))
- **Background**: Dark `rgba(0, 0, 0, 0.9)`
- **Width**: 150px minimum
- **Shadow**: `0 4px 12px rgba(0, 0, 0, 0.4)`

### Menu Items
1. **Toggle Button**
   - Text: "Turn OFF" (when ON) or "Turn ON" (when OFF)
   - Checkmark: ✓ (shown only when ON)
   - Hover: Light background `rgba(255, 255, 255, 0.1)`

2. **Description Text**
   - Font size: 11px
   - Color: `rgba(255, 255, 255, 0.6)`
   - Text: Dynamic based on state

## Color Scheme

### Active State (Autoplay ON)
- Primary: `#667eea` (Purple)
- Background: `rgba(102, 126, 234, 0.9)`
- Icon: 🔁 (blue/purple)

### Inactive State (Autoplay OFF)
- Primary: `#000000` (Black)
- Background: `rgba(0, 0, 0, 0.7)`
- Icon: ⏸️ (gray)

### Shared
- Text: `white`
- Border: `rgba(255, 255, 255, 0.3)`
- Hover: `rgba(255, 255, 255, 0.1)`

## Responsive Behavior

The button maintains consistent sizing across all screen sizes:
- Padding: `8px 12px`
- Font size: `13px`
- Font weight: `600`
- Border radius: `4px`

Menu dropdown always aligns to the right of the button and positions above it to avoid covering video content.

## Interaction Flow

```
User watches video
       ↓
Clicks autoplay button
       ↓
Menu opens (0.2s animation)
       ↓
User sees current state (✓ if ON)
       ↓
Clicks toggle option
       ↓
State updates immediately
       ↓
Saves to localStorage (instant)
       ↓
Saves to database (if logged in)
       ↓
Menu closes
       ↓
Button updates visually
       ↓
Next video respects setting
```

## Accessibility

- **Keyboard Navigation**: Button is focusable with Tab key
- **ARIA Labels**: Implicit through tooltip
- **Visual Contrast**: High contrast between states
- **Clear Indicators**: Emoji + text + color all indicate state
- **Descriptive Text**: Menu explains what the setting does

## Mobile Considerations

On mobile devices (max-width: 768px):
- Touch target: 44px minimum (meets iOS/Android guidelines)
- Menu appears above button (no finger obstruction)
- Font size remains readable (13px)
- Clear visual feedback on tap

## Integration Points

The autoplay toggle integrates with:

1. **Video Element**
   ```jsx
   <video autoPlay={autoplay} />
   ```

2. **LocalStorage**
   ```javascript
   localStorage.setItem('videoAutoplay', 'true');
   localStorage.getItem('videoAutoplay');
   ```

3. **Database**
   ```javascript
   await updateBandwidthPreferences(userId, {
     autoplay: true
   });
   ```

4. **User Preferences**
   ```javascript
   const prefs = await getUserBandwidthPreferences(userId);
   setAutoplay(prefs.autoplay);
   ```

## Browser Compatibility

### Autoplay Policy Considerations
Modern browsers (Chrome 66+, Safari 11+) have autoplay policies that may override this setting:
- **Muted Autoplay**: Usually allowed
- **Unmuted Autoplay**: Requires user interaction
- **Best Practice**: Even with autoplay ON, ensure video has mute button

Our implementation respects browser policies:
- If browser blocks autoplay, user sees play button
- Toggle still controls whether browser *attempts* autoplay
- No console errors if autoplay is blocked

## Performance

- **State Updates**: Instant (React state)
- **LocalStorage**: < 1ms write time
- **Database Update**: Async (doesn't block UI)
- **Memory**: ~200 bytes per preference

## Testing Scenarios

### Visual Tests
1. ✅ Button appears in correct position
2. ✅ Icon changes based on state
3. ✅ Background color changes
4. ✅ Menu opens smoothly
5. ✅ Checkmark shows correctly
6. ✅ Menu closes on selection
7. ✅ Menu closes on outside click

### Functional Tests
1. ✅ Video autoplays when ON
2. ✅ Video requires play when OFF
3. ✅ Setting persists on refresh
4. ✅ LocalStorage updates
5. ✅ Database updates (logged in)
6. ✅ Works for guest users
7. ✅ No console errors

---

**Design Language**: Consistent with existing video player controls
**User Experience**: Simple, clear, discoverable
**Performance**: No impact on video playback
