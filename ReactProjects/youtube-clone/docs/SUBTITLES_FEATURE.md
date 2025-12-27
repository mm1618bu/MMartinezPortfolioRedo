# Subtitles/Captions Support

## Overview
Complete subtitle and caption support for the YouTube clone, allowing video creators to upload subtitle files in multiple languages and viewers to select their preferred language while watching videos.

## Features

### ✅ For Video Creators
- **Upload Subtitles**: Upload subtitle files in VTT or SRT format
- **Multiple Languages**: Support for 15+ languages (English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Dutch, Polish, Turkish)
- **Auto-Conversion**: Automatically converts SRT files to WebVTT format
- **Default Subtitle**: Set a default subtitle track for your videos
- **Manage Subtitles**: View, update, and delete uploaded subtitles
- **Custom Labels**: Add custom labels like "English (CC)" or "Spanish (Spain)"

### ✅ For Viewers
- **Native Controls**: Use browser's native video player caption controls
- **Multiple Languages**: Switch between available subtitle languages
- **Auto-Load**: Default subtitles automatically load with the video
- **Accessibility**: Improved accessibility for hearing-impaired viewers

## Database Schema

### `subtitles` Table
```sql
- id (UUID, Primary Key)
- video_id (UUID, Foreign Key → videos.id)
- language (VARCHAR(10)) -- ISO 639-1 code (e.g., 'en', 'es')
- label (VARCHAR(100)) -- Display name (e.g., 'English', 'Spanish')
- subtitle_url (TEXT) -- URL to VTT file in Supabase Storage
- is_default (BOOLEAN) -- Whether this is the default subtitle
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Indexes
- `idx_subtitles_video_id` on `video_id`
- `idx_subtitles_language` on `language`

### RLS Policies
- **Public Access**: Anyone can view subtitles for public videos
- **Owner Access**: Video owners can manage (add/edit/delete) their subtitles

## Components

### `SubtitleManager.jsx`
Main component for managing video subtitles.

**Props:**
- `videoId` (string, required): The ID of the video
- `onUpdate` (function, optional): Callback fired after subtitle operations

**Features:**
- File upload with validation (max 5MB, VTT/SRT formats)
- Language selection from 15+ options
- Custom label input
- Default subtitle toggle
- List all uploaded subtitles
- Set default subtitle
- Delete subtitles

### `VideoPlayer.jsx` (Enhanced)
Updated to display subtitle tracks.

**New Features:**
- Loads subtitles from database on mount
- Renders `<track>` elements for each subtitle
- Supports `crossOrigin="anonymous"` for CORS
- Auto-selects default subtitle if available

## Utilities

### `subtitleUtils.js`

**Functions:**
- `convertSRTtoVTT(srtContent)`: Converts SRT format to WebVTT
- `validateSubtitleFile(file)`: Validates file size and format
- `readSubtitleFile(file)`: Reads subtitle file content
- `getLanguageOptions()`: Returns array of supported languages
- `parseVTTCues(vttContent)`: Parses VTT file for preview (optional)

### `supabase.js` (Extended)

**New Functions:**
- `uploadSubtitleToSupabase(file, videoId, language)`: Upload subtitle file to storage
- `saveSubtitleMetadata(subtitleData)`: Save subtitle info to database
- `getSubtitlesForVideo(videoId)`: Fetch all subtitles for a video
- `updateSubtitle(subtitleId, updates)`: Update subtitle metadata
- `deleteSubtitle(subtitleId)`: Delete subtitle from database and storage
- `setDefaultSubtitle(videoId, subtitleId)`: Set default subtitle for a video

## File Formats

### Supported Formats
1. **WebVTT (.vtt)** - Recommended, native HTML5 format
2. **SubRip (.srt)** - Auto-converted to VTT on upload

### WebVTT Example
```vtt
WEBVTT

00:00:00.000 --> 00:00:02.000
Hello, welcome to this video!

00:00:02.500 --> 00:00:05.000
Today we'll learn about subtitles.
```

### SRT Example (Auto-converted)
```srt
1
00:00:00,000 --> 00:00:02,000
Hello, welcome to this video!

2
00:00:02,500 --> 00:00:05,000
Today we'll learn about subtitles.
```

## Usage

### For Video Owners

1. **Upload a Subtitle**:
   ```jsx
   import SubtitleManager from './components/SubtitleManager';
   
   <SubtitleManager 
     videoId="your-video-id" 
     onUpdate={() => console.log('Subtitles updated!')}
   />
   ```

2. **The component provides**:
   - Upload form with file input
   - Language selector
   - Custom label input (optional)
   - Default subtitle checkbox
   - List of existing subtitles
   - Actions to set default or delete

### For Viewers

1. **Viewing with Subtitles**:
   - Video player automatically loads available subtitles
   - Click the CC button in video controls
   - Select desired language from the list
   - Subtitles display at the bottom of the video

## Validation Rules

### File Validation
- **Max Size**: 5MB
- **Allowed Formats**: .vtt, .srt
- **Auto-conversion**: SRT → VTT (commas replaced with periods in timestamps)

### Content Validation
- Proper timestamp format
- Valid cue structure
- UTF-8 encoding

## Storage Structure

```
supabase-storage/
└── subtitles/
    ├── {videoId}_en.vtt
    ├── {videoId}_es.vtt
    ├── {videoId}_fr.vtt
    └── ...
```

## API Reference

### Upload Subtitle
```javascript
const handleUpload = async () => {
  // 1. Read file
  const content = await readSubtitleFile(file);
  
  // 2. Convert if needed
  const vttContent = file.name.endsWith('.srt') 
    ? convertSRTtoVTT(content) 
    : content;
  
  // 3. Upload to storage
  const url = await uploadSubtitleToSupabase(vttFile, videoId, 'en');
  
  // 4. Save metadata
  await saveSubtitleMetadata({
    video_id: videoId,
    language: 'en',
    label: 'English',
    subtitle_url: url,
    is_default: false
  });
};
```

### Load Subtitles in Player
```javascript
useEffect(() => {
  const loadSubs = async () => {
    const subs = await getSubtitlesForVideo(videoId);
    setSubtitles(subs);
  };
  loadSubs();
}, [videoId]);
```

### Render Tracks
```jsx
<video controls>
  <source src={videoUrl} />
  {subtitles.map(sub => (
    <track
      key={sub.id}
      kind="captions"
      src={sub.subtitle_url}
      srcLang={sub.language}
      label={sub.label}
      default={sub.is_default}
    />
  ))}
</video>
```

## Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| en | English | ru | Russian |
| es | Spanish | ja | Japanese |
| fr | French | ko | Korean |
| de | German | zh | Chinese |
| it | Italian | ar | Arabic |
| pt | Portuguese | hi | Hindi |
| nl | Dutch | pl | Polish |
| tr | Turkish |

## Browser Support

All modern browsers support WebVTT subtitles:
- ✅ Chrome/Edge 23+
- ✅ Firefox 31+
- ✅ Safari 6+
- ✅ Opera 15+
- ✅ iOS Safari 7+
- ✅ Android Browser 4.4+

## Future Enhancements

- [ ] Auto-generate subtitles using Speech-to-Text API
- [ ] Subtitle editor with timeline sync
- [ ] Subtitle translation service
- [ ] Support for subtitle styling (color, position, size)
- [ ] Bulk upload multiple subtitles at once
- [ ] Subtitle preview before upload
- [ ] Download subtitles for offline use
- [ ] Community-contributed subtitles
- [ ] Subtitle quality rating system

## Testing

### Manual Testing Checklist
- [ ] Upload VTT file
- [ ] Upload SRT file (verify auto-conversion)
- [ ] Upload files in different languages
- [ ] Set default subtitle
- [ ] Change default subtitle
- [ ] Delete subtitle
- [ ] View video with subtitles enabled
- [ ] Switch between subtitle languages during playback
- [ ] Verify subtitle sync with video
- [ ] Test with oversized file (should reject)
- [ ] Test with invalid format (should reject)

## Migration

Run the migration to add subtitle support:

```bash
# Connect to your Supabase project
psql "your-database-connection-string"

# Run the migration
\i database/migrations/add_subtitles_support.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `add_subtitles_support.sql`
3. Execute the script

## Security Considerations

1. **File Size Limits**: 5MB maximum to prevent abuse
2. **Format Validation**: Only VTT and SRT files accepted
3. **RLS Policies**: Only video owners can manage subtitles
4. **Content Sanitization**: Subtitle content is served as plain text
5. **CORS**: `crossOrigin="anonymous"` prevents credential leaks

## Accessibility Benefits

- **WCAG 2.1 Level AA**: Provides captions for video content
- **Hearing Impaired**: Essential for deaf and hard-of-hearing users
- **Language Learners**: Helps non-native speakers understand content
- **Noisy Environments**: Allows viewing in sound-sensitive areas
- **Search Engine Optimization**: Subtitle text can be indexed

## Troubleshooting

### Subtitles Not Showing
1. Check browser console for errors
2. Verify subtitle URL is accessible
3. Ensure `crossOrigin="anonymous"` is set
4. Check VTT file format validity
5. Verify file is in UTF-8 encoding

### SRT Conversion Issues
- Ensure timestamps use proper format
- Check for extra whitespace
- Verify cue numbers are sequential
- Ensure file is UTF-8 encoded

### Upload Failures
- Check file size (< 5MB)
- Verify file extension (.vtt or .srt)
- Ensure valid video ID
- Check Supabase storage permissions

## License

Part of the YouTube Clone project. See main project LICENSE.
