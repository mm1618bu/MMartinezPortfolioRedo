# Video Upload Validation

## Overview
The YouTube clone now includes comprehensive video validation that checks format, size, and duration before allowing uploads.

## Validation Features

### 1. **Format Validation**
- **Allowed Formats**: MP4, WebM, OGG, MOV, AVI, MKV, MPEG
- Validates both MIME type and file extension
- Rejects unsupported video formats immediately

### 2. **Size Validation**
- **Maximum Size**: 500 MB
- **Minimum Size**: 100 KB
- Shows human-readable file sizes (e.g., "245.8 MB")
- Prevents upload of oversized files that could cause storage issues

### 3. **Duration Validation**
- **Maximum Duration**: 2 hours (7200 seconds)
- **Minimum Duration**: 1 second
- Automatically extracts video metadata
- Displays duration in HH:MM:SS or MM:SS format
- Detects corrupted files that can't be analyzed

## User Experience

### On File Selection:
1. **Validating State**: Shows "🔄 Validating video..." message
2. **Success State**: 
   - ✅ Displays file name, size, and duration
   - Shows in green color
   - Upload button is enabled
3. **Error State**: 
   - ❌ Lists all validation errors
   - Shows in red background
   - Upload button remains disabled until fixed

### Validation Errors Display:
- Clear, specific error messages
- Multiple errors shown if applicable
- Examples:
  - "File size exceeds maximum allowed size of 500 MB. Your file: 650 MB"
  - "Video duration exceeds maximum allowed duration of 2:00:00. Your video: 2:30:15"
  - "Invalid video format. Allowed formats: .mp4, .webm, .ogg, .mov, .avi, .mkv, .mpeg"

### Requirements Display:
Always visible below the file input showing:
- Max size: 500 MB
- Max duration: 2:00:00
- Supported formats

## Technical Implementation

### Files Created/Modified:

1. **`/src/front-end/utils/videoValidation.js`** (NEW)
   - `validateVideo(file)` - Main validation function
   - `validateFormat(file)` - Format checking
   - `validateSize(file)` - Size checking
   - `validateDuration(file)` - Duration checking (async)
   - `formatBytes(bytes)` - Human-readable sizes
   - `formatDuration(seconds)` - Human-readable durations
   - `getVideoConstraints()` - Get constraint values for UI

2. **`/src/front-end/components/VideoUpload.jsx`** (MODIFIED)
   - Added validation state: `validationErrors`, `isValidating`, `videoInfo`
   - Integrated validation on file selection
   - Prevents upload if validation fails
   - Shows real-time validation feedback

3. **`/src/styles/main.css`** (MODIFIED)
   - `.VideoUpload-validationErrors` - Error container styles
   - `.VideoUpload-validationError` - Individual error message styles
   - `.VideoUpload-constraints` - Requirements display styles

## Configuration

Edit constraints in `/src/front-end/utils/videoValidation.js`:

```javascript
const VIDEO_CONSTRAINTS = {
  allowedFormats: ['video/mp4', 'video/webm', ...],
  maxSizeBytes: 500 * 1024 * 1024,  // 500 MB
  minSizeBytes: 100 * 1024,          // 100 KB
  maxDurationSeconds: 2 * 60 * 60,   // 2 hours
  minDurationSeconds: 1,              // 1 second
};
```

## Testing

### Test Cases:
1. ✅ Upload valid MP4 under 500 MB and under 2 hours
2. ❌ Try to upload 600 MB video (should fail size validation)
3. ❌ Try to upload 3-hour video (should fail duration validation)
4. ❌ Try to upload .txt file (should fail format validation)
5. ❌ Try to upload corrupted video (should fail metadata extraction)

## Benefits

- **User-friendly**: Clear feedback before upload starts
- **Server-friendly**: Prevents invalid uploads reaching storage
- **Cost-effective**: Reduces storage and bandwidth waste
- **Secure**: Validates file types to prevent malicious uploads
- **Configurable**: Easy to adjust constraints as needed
