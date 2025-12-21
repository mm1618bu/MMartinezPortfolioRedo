import { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import {
  uploadVideoToSupabase,
  uploadThumbnailToSupabase,
  saveVideoMetadata,
} from "../utils/supabase";
import {
  validateVideo,
  formatBytes,
  formatDuration,
  getVideoConstraints,
} from "../utils/videoValidation";
import { createEncodingJob } from "../utils/encodingQueueAPI";
import { supabase } from "../utils/supabase";
import { invalidateVideoCache } from "../utils/videoCacheUtils";

import "../../styles/main.css";

export default function VideoUpload() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [channelName, setChannelName] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [encodingJobId, setEncodingJobId] = useState(null);
  const [showEncodingStatus, setShowEncodingStatus] = useState(false);

  /************************************
   * HANDLE FORM SUBMIT
   ************************************/
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !videoFile) {
      setMessage("Please provide a title and video file");
      return;
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      setMessage("❌ Please fix validation errors before uploading");
      return;
    }

    setUploading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      await uploadSingleFile();
      
      // Invalidate video cache to refresh lists
      invalidateVideoCache(queryClient);
      
      setMessage("✅ Video uploaded successfully! Encoding job created.");
      setShowEncodingStatus(true);

      // Reset form
      setTitle("");
      setDescription("");
      setKeywords("");
      setChannelName("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoDuration(0);
      setUploadProgress(0);
      setValidationErrors([]);
      setVideoInfo(null);
      setIsPublic(true);
      setVideoMetadata(null);

      document.getElementById("videoInput").value = "";
      document.getElementById("thumbnailInput").value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  /************************************
   * SINGLE FILE UPLOAD
   ************************************/
  const uploadSingleFile = async () => {
    const videoId = `vid_${Date.now()}`;

    // Upload video
    setUploadProgress(10);
    const videoUrl = await uploadVideoToSupabase(videoFile, videoId);

    // Upload thumbnail (optional)
    setUploadProgress(50);
    let thumbnailUrl = null;
    if (thumbnailFile) {
      thumbnailUrl = await uploadThumbnailToSupabase(thumbnailFile, videoId);
    }

    // Save metadata
    setUploadProgress(80);

    const videoData = {
      id: videoId,
      title: title,
      description: description || "",
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k),
      channel_name: channelName || "My Channel",
      thumbnail_url: thumbnailUrl || "https://placehold.co/320x180",
      video_url: videoUrl,
      views: 0,
      likes: 0,
      dislikes: 0,
      duration: videoDuration,
      is_public: isPublic,
      // Video metadata
      file_size: videoFile.size,
      resolution: videoMetadata?.resolution || null,
      width: videoMetadata?.width || null,
      height: videoMetadata?.height || null,
      aspect_ratio: videoMetadata?.aspectRatio || null,
      quality: videoMetadata?.quality || null,
      created_at: new Date().toISOString(),
    };

    await saveVideoMetadata(videoData);

    setUploadProgress(90);

    // Create encoding job
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const jobId = await createEncodingJob(
          videoId,
          user.id,
          videoUrl,
          videoFile.size,
          videoMetadata?.resolution || null,
          ['1080p', '720p', '480p', '360p'], // Output formats
          5 // Priority (1-10, 5 is normal)
        );
        setEncodingJobId(jobId);
        console.log('Encoding job created:', jobId);
      }
    } catch (error) {
      console.error('Error creating encoding job:', error);
      // Don't fail the upload if encoding job creation fails
    }

    setUploadProgress(100);
  };

  /************************************
   * JSX
   ************************************/
  return (
    <div className="VideoUpload-container">
      <h2 className="VideoUpload-title">Upload Video</h2>

      <form onSubmit={handleSubmit} className="VideoUpload-form">

        {/* TITLE */}
        <div className="VideoUpload-field">
          <label htmlFor="title" className="VideoUpload-label">
            Title *
          </label>
          <input
            id="title"
            type="text"
            className="VideoUpload-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter video title"
          />
        </div>

        {/* DESCRIPTION */}
        <div className="VideoUpload-field">
          <label htmlFor="description" className="VideoUpload-label">
            Description
          </label>
          <textarea
            id="description"
            className="VideoUpload-textarea"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description (optional)"
          />
        </div>

        {/* KEYWORDS */}
        <div className="VideoUpload-field">
          <label htmlFor="keywords" className="VideoUpload-label">
            Keywords/Tags
          </label>
          <input
            id="keywords"
            type="text"
            className="VideoUpload-input"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="gaming, tutorial, vlog, etc. (comma separated)"
          />
        </div>

        {/* CHANNEL NAME */}
        <div className="VideoUpload-field">
          <label htmlFor="channelName" className="VideoUpload-label">
            Channel Name
          </label>
          <input
            id="channelName"
            type="text"
            className="VideoUpload-input"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="Enter your channel name (optional)"
          />
        </div>

        {/* VIDEO FILE */}
        <div className="VideoUpload-field">
          <label htmlFor="videoInput" className="VideoUpload-label">
            Video File *
          </label>
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            className="VideoUpload-file"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                setIsValidating(true);
                setValidationErrors([]);
                setVideoInfo(null);
                
                // Validate the video file
                const validation = await validateVideo(file);
                
                if (validation.valid) {
                  setVideoFile(file);
                  setVideoDuration(validation.duration);
                  setVideoMetadata(validation.metadata);
                  setVideoInfo({
                    name: validation.fileName,
                    size: formatBytes(validation.fileSize),
                    duration: formatDuration(validation.duration),
                    type: validation.fileType,
                    resolution: validation.metadata?.resolution || 'Unknown',
                    quality: validation.metadata?.quality || 'Unknown',
                    aspectRatio: validation.metadata?.aspectRatio || 'Unknown',
                  });
                  setValidationErrors([]);
                  setMessage("");
                } else {
                  setVideoFile(null);
                  setVideoDuration(0);
                  setVideoMetadata(null);
                  setValidationErrors(validation.errors);
                  setMessage("❌ Video validation failed");
                }
                
                setIsValidating(false);
              }
            }}
            disabled={isValidating}
            required
          />
          {isValidating && (
            <p className="VideoUpload-fileInfo" style={{ color: '#667eea' }}>
              🔄 Validating video...
            </p>
          )}
          {videoInfo && (
            <div className="VideoUpload-fileInfo" style={{ color: '#22c55e' }}>
              ✅ <strong>{videoInfo.name}</strong>
              <div style={{ fontSize: '0.9em', marginTop: '4px' }}>
                <div>Size: {videoInfo.size} | Duration: {videoInfo.duration}</div>
                <div>Resolution: {videoInfo.resolution} ({videoInfo.quality}) | Aspect Ratio: {videoInfo.aspectRatio}</div>
              </div>
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="VideoUpload-validationErrors">
              {validationErrors.map((error, index) => (
                <div key={index} className="VideoUpload-validationError">
                  ❌ {error.message}
                </div>
              ))}
            </div>
          )}
          <div className="VideoUpload-constraints">
            <small>
              <strong>Requirements:</strong> Max size: {getVideoConstraints().maxSize}
            </small>
          </div>
        </div>

        {/* PRIVACY SETTING */}
        <div className="VideoUpload-field">
          <label className="VideoUpload-label">
            Privacy Setting
          </label>
          <div className="VideoUpload-privacy-toggle">
            <button
              type="button"
              className={`VideoUpload-privacy-button ${isPublic ? 'active' : ''}`}
              onClick={() => setIsPublic(true)}
            >
              <span className="privacy-icon">🌐</span>
              <div>
                <div className="privacy-title">Public</div>
                <div className="privacy-desc">Everyone can watch your video</div>
              </div>
            </button>
            <button
              type="button"
              className={`VideoUpload-privacy-button ${!isPublic ? 'active' : ''}`}
              onClick={() => setIsPublic(false)}
            >
              <span className="privacy-icon">🔒</span>
              <div>
                <div className="privacy-title">Private</div>
                <div className="privacy-desc">Only you can watch your video</div>
              </div>
            </button>
          </div>
        </div>

        {/* THUMBNAIL FILE */}
        <div className="VideoUpload-field">
          <label htmlFor="thumbnailInput" className="VideoUpload-label">
            Thumbnail Image
          </label>
          <input
            id="thumbnailInput"
            type="file"
            accept="image/*"
            className="VideoUpload-file"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
          />
          {thumbnailFile && (
            <p className="VideoUpload-fileInfo">
              Selected: {thumbnailFile.name}
            </p>
          )}
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={uploading}
          className="VideoUpload-button"
        >
          {uploading
            ? `Uploading... ${uploadProgress.toFixed(0)}%`
            : "Upload Video"}
        </button>
      </form>

      {/* PROGRESS BAR */}
      {uploading && uploadProgress > 0 && (
        <div className="VideoUpload-progressWrapper">
          <div className="VideoUpload-progressLabel">
            <span>Upload Progress</span>
            <span>{uploadProgress.toFixed(1)}%</span>
          </div>
          <div className="VideoUpload-progressBar">
            <div
              className="VideoUpload-progressFill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <div
          className={
            "VideoUpload-message " +
            (message.includes("✅")
              ? "VideoUpload-message--success"
              : "VideoUpload-message--error")
          }
        >
          {message}
        </div>
      )}
    </div>
  );
}
