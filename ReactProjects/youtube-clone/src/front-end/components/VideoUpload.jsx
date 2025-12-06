import { useState } from "react";
import {
  uploadVideoToSupabase,
  uploadThumbnailToSupabase,
  saveVideoMetadata,
} from "../utils/supabase";

import "../../styles/main.css";

export default function VideoUpload() {
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

  /************************************
   * HANDLE FORM SUBMIT
   ************************************/
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !videoFile) {
      setMessage("Please provide a title and video file");
      return;
    }

    setUploading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      await uploadSingleFile();
      setMessage("✅ Video uploaded successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setKeywords("");
      setChannelName("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoDuration(0);
      setUploadProgress(0);

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
      created_at: new Date().toISOString(),
    };

    await saveVideoMetadata(videoData);

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
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setVideoFile(file);
                const video = document.createElement("video");
                video.preloaded = "metadata";
                video.onloadedmetadata = () => {
                  window.URL.revokeObjectURL(video.src);
                  setVideoDuration(Math.round(video.duration));
                };
                video.src = URL.createObjectURL(file);
              }
            }}
            required
          />
          {videoFile && (
            <p className="VideoUpload-fileInfo">
              Selected: {videoFile.name}
            </p>
          )}
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
