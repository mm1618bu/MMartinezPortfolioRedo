import { useState } from 'react';
import { 
  uploadSubtitleToSupabase, 
  saveSubtitleMetadata,
  getSubtitlesForVideo,
  deleteSubtitle,
  setDefaultSubtitle
} from '../utils/supabase';
import { 
  validateSubtitleFile, 
  readSubtitleFile, 
  convertSRTtoVTT,
  getLanguageOptions 
} from '../utils/subtitleUtils';
import '../../styles/main.css';

export default function SubtitleManager({ videoId, onUpdate }) {
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Upload form state
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [customLabel, setCustomLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const languages = getLanguageOptions();

  // Load existing subtitles
  const loadSubtitles = async () => {
    setLoading(true);
    try {
      const subs = await getSubtitlesForVideo(videoId);
      setSubtitles(subs);
    } catch (error) {
      console.error('Error loading subtitles:', error);
      setMessage('❌ Error loading subtitles');
    } finally {
      setLoading(false);
    }
  };

  // Load subtitles on mount
  useState(() => {
    if (videoId) {
      loadSubtitles();
    }
  }, [videoId]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateSubtitleFile(file);
    if (!validation.valid) {
      setMessage('❌ ' + validation.errors.join(', '));
      setSubtitleFile(null);
      return;
    }

    setSubtitleFile(file);
    setMessage('');
  };

  // Handle subtitle upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!subtitleFile) {
      setMessage('❌ Please select a subtitle file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Read file content
      let content = await readSubtitleFile(subtitleFile);

      // Convert SRT to VTT if needed
      if (subtitleFile.name.toLowerCase().endsWith('.srt')) {
        content = convertSRTtoVTT(content);
      }

      // Create a VTT file blob
      const vttBlob = new Blob([content], { type: 'text/vtt' });
      const vttFile = new File([vttBlob], `${language}.vtt`, { type: 'text/vtt' });

      // Upload to storage
      const subtitleUrl = await uploadSubtitleToSupabase(vttFile, videoId, language);

      // Get label
      const selectedLang = languages.find(l => l.code === language);
      const label = customLabel || selectedLang?.label || language;

      // Save metadata
      await saveSubtitleMetadata({
        video_id: videoId,
        language: language,
        label: label,
        subtitle_url: subtitleUrl,
        is_default: isDefault
      });

      setMessage('✅ Subtitle uploaded successfully!');
      
      // Reset form
      setSubtitleFile(null);
      setCustomLabel('');
      setIsDefault(false);
      setShowUploadForm(false);
      document.getElementById('subtitleInput').value = '';

      // Reload subtitles
      await loadSubtitles();
      
      // Notify parent component
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete subtitle
  const handleDelete = async (subtitleId) => {
    if (!window.confirm('Are you sure you want to delete this subtitle?')) {
      return;
    }

    try {
      await deleteSubtitle(subtitleId);
      setMessage('✅ Subtitle deleted');
      await loadSubtitles();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Handle set default
  const handleSetDefault = async (subtitleId) => {
    try {
      await setDefaultSubtitle(videoId, subtitleId);
      setMessage('✅ Default subtitle updated');
      await loadSubtitles();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error setting default:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="subtitle-manager">
      <div className="subtitle-manager-header">
        <h3>Subtitles / Captions</h3>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="btn-add-subtitle"
        >
          {showUploadForm ? '✕ Cancel' : '+ Add Subtitle'}
        </button>
      </div>

      {message && (
        <div className={`subtitle-message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showUploadForm && (
        <form onSubmit={handleUpload} className="subtitle-upload-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subtitleInput">Subtitle File (VTT or SRT)</label>
              <input
                type="file"
                id="subtitleInput"
                accept=".vtt,.srt"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <small>Max 5MB • Formats: VTT, SRT</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={uploading}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customLabel">Custom Label (Optional)</label>
              <input
                type="text"
                id="customLabel"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g., English (CC)"
                disabled={uploading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={uploading}
              />
              Set as default subtitle
            </label>
          </div>

          <button type="submit" disabled={uploading || !subtitleFile} className="btn-upload">
            {uploading ? 'Uploading...' : 'Upload Subtitle'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="subtitle-loading">Loading subtitles...</div>
      ) : subtitles.length > 0 ? (
        <div className="subtitle-list">
          {subtitles.map((subtitle) => (
            <div key={subtitle.id} className="subtitle-item">
              <div className="subtitle-info">
                <span className="subtitle-language">
                  {subtitle.label}
                  {subtitle.is_default && <span className="default-badge">Default</span>}
                </span>
                <span className="subtitle-code">({subtitle.language})</span>
              </div>
              <div className="subtitle-actions">
                {!subtitle.is_default && (
                  <button
                    onClick={() => handleSetDefault(subtitle.id)}
                    className="btn-set-default"
                    title="Set as default"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(subtitle.id)}
                  className="btn-delete"
                  title="Delete subtitle"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-subtitles">
          No subtitles uploaded yet. Add your first subtitle to make your video accessible to more viewers.
        </div>
      )}
    </div>
  );
}
