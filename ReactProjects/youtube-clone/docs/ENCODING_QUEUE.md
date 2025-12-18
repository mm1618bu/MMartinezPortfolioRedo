# Video Encoding Queue System

## Overview
An asynchronous video encoding queue system that allows videos to be uploaded immediately while processing happens in the background. This prevents long upload waits and provides real-time status updates.

## Architecture

### Database Layer
- **encoding_jobs table**: Tracks all encoding jobs with status, progress, and metadata
- **encoding_queue_stats table**: Aggregates statistics for monitoring system health
- **RPC Functions**: 
  - `create_encoding_job()` - Creates new encoding jobs
  - `get_next_encoding_job()` - Queue worker fetches next job
  - `update_encoding_job_status()` - Updates job progress
  - `get_encoding_job_status()` - Gets status for specific video
  - `get_user_encoding_jobs()` - Lists user's jobs
  - `cancel_encoding_job()` - Cancels pending/processing jobs

### API Layer (`encodingQueueAPI.js`)
JavaScript utilities for interacting with the encoding queue:
- Create and manage encoding jobs
- Real-time subscriptions using Supabase Realtime
- Status formatting and queue statistics
- Retry failed jobs

### Components

#### EncodingQueue Component
Full-page interface for managing encoding jobs:
- View all user's encoding jobs
- Filter by status (queued, processing, completed, failed)
- Real-time progress updates
- Cancel/retry actions
- Visual progress bars

#### EncodingStatusBadge Component
Compact widget for showing encoding status inline:
- Auto-updates in real-time
- Minimal UI footprint
- Shows progress for processing jobs
- Hides when encoding completes

## Workflow

### 1. Video Upload
```javascript
// User uploads video
const videoId = await uploadVideo(file);

// Immediately create encoding job
const jobId = await createEncodingJob(
  videoId,
  userId,
  videoUrl,
  fileSize,
  resolution,
  ['1080p', '720p', '480p', '360p'], // Output formats
  5 // Priority (1=highest, 10=lowest)
);
```

### 2. Queue Processing
```
[Worker Process - Not implemented in frontend]
1. Fetch next job: get_next_encoding_job()
2. Update status: 'processing'
3. Encode video to multiple formats
4. Update progress periodically
5. Save output files
6. Update status: 'completed' or 'failed'
```

### 3. Real-time Updates
```javascript
// Subscribe to job updates
const subscription = subscribeToEncodingJob(videoId, (status) => {
  console.log('Job updated:', status);
  // UI automatically updates
});
```

## Job Status Flow

```
QUEUED → PROCESSING → COMPLETED
                    ↓
                   FAILED (can retry)
                    ↓
                 CANCELLED
```

## Priority System
- **1-3**: High priority (premium users, urgent content)
- **4-7**: Normal priority (regular uploads)
- **8-10**: Low priority (bulk uploads, background tasks)

## Database Schema

### encoding_jobs
```sql
- id: UUID (primary key)
- video_id: TEXT (foreign key to videos)
- user_id: UUID (foreign key to auth.users)
- status: VARCHAR(50) 
- priority: INT (1-10)
- input_file_url: TEXT
- input_file_size: BIGINT
- output_formats: JSONB
- output_files: JSONB
- progress: INT (0-100)
- current_step: VARCHAR(100)
- queued_at: TIMESTAMP
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- error_message: TEXT
- retry_count: INT
- max_retries: INT
```

## Usage Examples

### Creating an Encoding Job
```javascript
import { createEncodingJob } from './utils/encodingQueueAPI';

const jobId = await createEncodingJob(
  videoId,
  userId,
  'https://storage.example.com/video.mp4',
  104857600, // 100MB
  '1080p',
  ['720p', '480p', '360p'],
  5 // Normal priority
);
```

### Checking Job Status
```javascript
import { getEncodingJobStatus } from './utils/encodingQueueAPI';

const status = await getEncodingJobStatus(videoId);
console.log(status);
// {
//   job_id: '...',
//   status: 'processing',
//   progress: 45,
//   current_step: 'Encoding 720p...',
//   ...
// }
```

### Displaying Encoding Status
```jsx
import EncodingStatusBadge from './components/EncodingStatusBadge';

<EncodingStatusBadge videoId={videoId} />
```

### Viewing Encoding Queue
```jsx
import { Link } from 'react-router-dom';

<Link to="/encoding-queue">View Encoding Queue</Link>
```

## Features

✅ **Asynchronous Processing**: Upload completes immediately, encoding happens in background
✅ **Priority Queue**: High-priority jobs processed first
✅ **Real-time Updates**: Progress updates via Supabase Realtime
✅ **Retry Logic**: Failed jobs can be retried automatically or manually
✅ **Multi-format Output**: Encode to multiple resolutions simultaneously
✅ **User Dashboard**: Full-featured UI for managing encoding jobs
✅ **Compact Widgets**: Inline status indicators for video pages
✅ **Error Handling**: Detailed error messages and retry capabilities
✅ **Statistics**: Queue metrics and performance tracking

## Worker Implementation (TODO)

The frontend provides the queue interface, but you'll need a backend worker to actually process videos. Options:

### Option 1: Supabase Edge Functions
```typescript
import { serve } from 'https://deno.land/std/http/server.ts';
import FFmpeg from 'ffmpeg-wasm';

serve(async (req) => {
  // Fetch next job
  const job = await getNextEncodingJob();
  
  // Download video
  const video = await fetch(job.input_file_url);
  
  // Encode with FFmpeg
  await ffmpeg.encode(video, job.output_formats);
  
  // Upload results
  // Update job status
});
```

### Option 2: External Worker (Node.js/Python)
```javascript
// worker.js
const { createClient } = require('@supabase/supabase-js');
const ffmpeg = require('fluent-ffmpeg');

async function processQueue() {
  while (true) {
    const job = await getNextJob();
    if (!job) {
      await sleep(5000);
      continue;
    }
    
    await processVideo(job);
  }
}
```

### Option 3: Cloud Services
- AWS MediaConvert
- Google Cloud Transcoder
- Azure Media Services
- Cloudflare Stream

## Monitoring

### Queue Health Check
```javascript
import { getEncodingQueueStats } from './utils/encodingQueueAPI';

const stats = await getEncodingQueueStats();
// {
//   queued: 12,
//   processing: 3,
//   highPriority: 2,
//   mediumPriority: 10,
//   lowPriority: 3
// }
```

### Job Metrics
- Average processing time
- Success/failure rates
- Queue wait times
- Format-specific performance

## Security

- **Row Level Security**: Users can only see/manage their own jobs
- **Rate Limiting**: Prevent queue flooding
- **Authentication**: All operations require valid auth token
- **Validation**: Input validation on all API calls

## Performance Tips

1. **Batch Processing**: Process multiple formats in parallel
2. **Caching**: Cache encoded results for common formats
3. **CDN Integration**: Serve encoded videos from CDN
4. **Resource Scaling**: Auto-scale workers based on queue depth
5. **Priority Management**: Adjust priorities based on user tier

## Troubleshooting

### Jobs Stuck in "Queued"
- Check if worker is running
- Verify database connectivity
- Check FOR UPDATE SKIP LOCKED is working

### Real-time Updates Not Working
- Verify Supabase Realtime is enabled
- Check subscription channel names
- Ensure RLS policies allow SELECT

### Failed Jobs
- Check error_message field
- Verify input file accessibility
- Check FFmpeg/encoder logs
- Retry with higher timeout

## Migration

Run the SQL migration in Supabase SQL Editor:
```bash
/workspaces/MMartinezPortfolioRedo/ReactProjects/youtube-clone/database/migrations/create_encoding_queue.sql
```

## Future Enhancements

- [ ] Email notifications on completion/failure
- [ ] Webhook callbacks for job status changes
- [ ] Advanced queue analytics dashboard
- [ ] Cost estimation per job
- [ ] Format presets (YouTube, Instagram, TikTok)
- [ ] Thumbnail generation from video
- [ ] Audio track extraction
- [ ] Subtitle/caption embedding
- [ ] DRM protection
- [ ] Adaptive bitrate streaming (HLS/DASH)
