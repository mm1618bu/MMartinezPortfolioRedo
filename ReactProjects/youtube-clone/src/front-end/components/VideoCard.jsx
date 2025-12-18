import React, { useState, useEffect } from 'react';
import { highlightSearchTerms } from '../utils/searchAPI';
import './VideoCard.css';

const VideoCard = ({ video, onClick, highlightQuery = '', viewMode = 'grid', showRelevanceScore = false }) => {
  const [timeAgo, setTimeAgo] = useState('');

  // Calculate time ago
  useEffect(() => {
    const updateTimeAgo = () => {
      if (video.created_at) {
        const now = new Date();
        const uploaded = new Date(video.created_at);
        const seconds = Math.floor((now - uploaded) / 1000);
        
        if (seconds < 60) setTimeAgo(`${seconds}s ago`);
        else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
        else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
        else if (seconds < 604800) setTimeAgo(`${Math.floor(seconds / 86400)}d ago`);
        else if (seconds < 2592000) setTimeAgo(`${Math.floor(seconds / 604800)}w ago`);
        else if (seconds < 31536000) setTimeAgo(`${Math.floor(seconds / 2592000)}mo ago`);
        else setTimeAgo(`${Math.floor(seconds / 31536000)}y ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [video.created_at]);

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format views
  const formatViews = (count) => {
    if (count < 1000) return count;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // Highlight search terms in text
  const renderHighlightedText = (text) => {
    if (!highlightQuery || !text) return text;
    
    const highlighted = highlightSearchTerms(text, highlightQuery);
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(video.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="video-card list-view" onClick={handleClick}>
        {/* Thumbnail */}
        <div className="video-card-thumbnail">
          <img
            src={video.thumbnail_url || "https://placehold.co/320x180?text=No+Thumbnail"}
            alt={video.title}
          />
          {video.duration > 0 && (
            <span className="video-card-duration">
              {formatDuration(video.duration)}
            </span>
          )}
          {video.quality && (
            <span className="video-card-quality">{video.quality}</span>
          )}
        </div>

        {/* Video Info */}
        <div className="video-card-info">
          <h3 className="video-card-title">
            {renderHighlightedText(video.title)}
          </h3>
          
          <div className="video-card-meta">
            <span className="video-card-views">
              {formatViews(video.views)} views
            </span>
            <span className="video-card-separator">•</span>
            <span className="video-card-time">{timeAgo}</span>
          {showRelevanceScore && video.relevance_score !== undefined && (
            <>
              <span className="video-card-separator">•</span>
              <span className="video-card-relevance" title="Relevance Score">
                ⭐ {video.relevance_score.toFixed(1)}
              </span>
            </>
          )}
          {video.description && (
            <p className="video-card-description">
              {renderHighlightedText(video.description)}
            </p>
          )}

          {video.keywords && video.keywords.length > 0 && (
            <div className="video-card-tags">
              {video.keywords.slice(0, 3).map((keyword, index) => (
                <span key={index} className="video-card-tag">
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="video-card grid-view" onClick={handleClick}>
      {/* Thumbnail */}
      <div className="video-card-thumbnail-container">
        <img
          src={video.thumbnail_url || "https://placehold.co/320x180?text=No+Thumbnail"}
          alt={video.title}
          className="video-card-thumbnail-image"
        />
        
        {/* Duration badge */}
        {video.duration > 0 && (
          <span className="video-card-duration">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Quality badge */}
        {video.quality && (
          <span className="video-card-quality">{video.quality}</span>
        )}

        {/* Privacy badge */}
        {video.is_public === false && (
          <span className="video-card-private">
            🔒 Private
          </span>
        )}
      </div>

      {/* Video Info */}
      <div className="video-card-details">
        <h3 className="video-card-title">
          {renderHighlightedText(video.title)}
        </h3>

        <div className="video-card-channel">
          {renderHighlightedText(video.channel_name || 'Unknown Channel')}
        </div>

        <div className="video-card-meta">
          <span className="video-card-views">
            {formatViews(video.views)} views
          </span>
          <span className="video-card-separator">•</span>
          <span className="video-card-time">{timeAgo}</span>
          {showRelevanceScore && video.relevance_score !== undefined && (
            <>
              <span className="video-card-separator">•</span>
              <span className="video-card-relevance" title="Relevance Score">
                ⭐ {video.relevance_score.toFixed(1)}
              </span>
            </>
          )}
        </div>

        {video.description && (
          <p className="video-card-description">
            {renderHighlightedText(video.description)}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
