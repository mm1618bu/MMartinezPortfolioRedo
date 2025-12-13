/**
 * Example: Using SubtitleManager Component
 * 
 * This file demonstrates how to integrate the SubtitleManager component
 * into your video management interface.
 */

import { useState } from 'react';
import SubtitleManager from './SubtitleManager';

export default function VideoManagementExample() {
  const [videoId] = useState('your-video-id-here');
  const [subtitlesUpdated, setSubtitlesUpdated] = useState(false);

  const handleSubtitleUpdate = () => {
    console.log('✅ Subtitles have been updated!');
    setSubtitlesUpdated(true);
    
    // Optionally reload video data or refresh the player
    // reloadVideo();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1>Video Management</h1>
      
      {/* Video Info Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2>My Awesome Video</h2>
        <p>Description of the video goes here...</p>
      </div>

      {/* Subtitle Manager Component */}
      <SubtitleManager 
        videoId={videoId}
        onUpdate={handleSubtitleUpdate}
      />

      {/* Other management options */}
      <div style={{ marginTop: '30px' }}>
        <h3>Other Options</h3>
        <button>Edit Video Details</button>
        <button>Manage Playlists</button>
        <button>View Analytics</button>
      </div>
    </div>
  );
}


/**
 * Example: SubtitleManager in a Modal
 */
export function SubtitleModalExample() {
  const [showModal, setShowModal] = useState(false);
  const videoId = 'video-123';

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Manage Subtitles
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Manage Subtitles</h2>
              <button onClick={() => setShowModal(false)} style={{ fontSize: '24px', border: 'none', background: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            
            <SubtitleManager 
              videoId={videoId}
              onUpdate={() => {
                console.log('Subtitles updated!');
                // Optionally close modal after successful upload
                // setShowModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * Example: Programmatic Subtitle Upload
 */
export async function uploadSubtitleProgrammatically() {
  const { 
    uploadSubtitleToSupabase, 
    saveSubtitleMetadata 
  } = await import('../utils/supabase');
  
  const { 
    readSubtitleFile, 
    convertSRTtoVTT,
    validateSubtitleFile 
  } = await import('../utils/subtitleUtils');

  // 1. Get file from input or drag-and-drop
  const file = document.getElementById('subtitle-file').files[0];
  const videoId = 'your-video-id';
  
  // 2. Validate file
  const validation = validateSubtitleFile(file);
  if (!validation.valid) {
    alert('Invalid file: ' + validation.errors.join(', '));
    return;
  }

  // 3. Read file content
  let content = await readSubtitleFile(file);

  // 4. Convert SRT to VTT if needed
  if (file.name.toLowerCase().endsWith('.srt')) {
    content = convertSRTtoVTT(content);
  }

  // 5. Create VTT blob
  const vttBlob = new Blob([content], { type: 'text/vtt' });
  const vttFile = new File([vttBlob], 'en.vtt', { type: 'text/vtt' });

  // 6. Upload to storage
  const subtitleUrl = await uploadSubtitleToSupabase(vttFile, videoId, 'en');

  // 7. Save metadata
  await saveSubtitleMetadata({
    video_id: videoId,
    language: 'en',
    label: 'English',
    subtitle_url: subtitleUrl,
    is_default: true
  });

  console.log('✅ Subtitle uploaded successfully!');
}


/**
 * Example: Load and Display Subtitles in Video Player
 */
export function VideoPlayerWithSubtitles({ videoUrl, videoId }) {
  const [subtitles, setSubtitles] = useState([]);

  useEffect(() => {
    const loadSubtitles = async () => {
      const { getSubtitlesForVideo } = await import('../utils/supabase');
      const subs = await getSubtitlesForVideo(videoId);
      setSubtitles(subs);
    };
    loadSubtitles();
  }, [videoId]);

  return (
    <video controls crossOrigin="anonymous" style={{ width: '100%' }}>
      <source src={videoUrl} type="video/mp4" />
      
      {/* Dynamically render subtitle tracks */}
      {subtitles.map((subtitle) => (
        <track
          key={subtitle.id}
          kind="captions"
          src={subtitle.subtitle_url}
          srcLang={subtitle.language}
          label={subtitle.label}
          default={subtitle.is_default}
        />
      ))}
      
      Your browser does not support the video tag.
    </video>
  );
}


/**
 * Example: Create Sample VTT File
 */
export function createSampleVTT() {
  const vttContent = `WEBVTT

00:00:00.000 --> 00:00:02.500
Hello and welcome to this video!

00:00:02.500 --> 00:00:05.000
In this tutorial, we'll learn about subtitles.

00:00:05.500 --> 00:00:08.000
Subtitles make your content accessible to everyone.

00:00:08.500 --> 00:00:11.000
You can upload VTT or SRT format files.

00:00:11.500 --> 00:00:14.000
Multiple languages are supported!
`;

  // Create downloadable file
  const blob = new Blob([vttContent], { type: 'text/vtt' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-subtitle.vtt';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Sample VTT file downloaded!');
}


/**
 * Example: Create Sample SRT File
 */
export function createSampleSRT() {
  const srtContent = `1
00:00:00,000 --> 00:00:02,500
Hello and welcome to this video!

2
00:00:02,500 --> 00:00:05,000
In this tutorial, we'll learn about subtitles.

3
00:00:05,500 --> 00:00:08,000
Subtitles make your content accessible to everyone.

4
00:00:08,500 --> 00:00:11,000
You can upload VTT or SRT format files.

5
00:00:11,500 --> 00:00:14,000
Multiple languages are supported!
`;

  // Create downloadable file
  const blob = new Blob([srtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-subtitle.srt';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Sample SRT file downloaded!');
}
