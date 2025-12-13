import '../../styles/main.css';

export default function ChannelAbout({ channelData, channelStats, userData }) {
  if (!channelData) {
    return (
      <div className="channel-about-empty">
        <p>Channel information not available</p>
      </div>
    );
  }

  const createdDate = channelData.created_at 
    ? new Date(channelData.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Unknown';

  return (
    <div className="channel-about-container">
      {/* Description Section */}
      <section className="channel-about-section">
        <h2 className="channel-about-heading">Description</h2>
        <div className="channel-about-description">
          {channelData.channel_description || 'No description provided yet.'}
        </div>
      </section>

      {/* Channel Details */}
      <section className="channel-about-section">
        <h2 className="channel-about-heading">Channel Details</h2>
        <div className="channel-about-details">
          <div className="channel-about-detail-item">
            <span className="channel-about-detail-label">Channel Name:</span>
            <span className="channel-about-detail-value">{channelData.channel_name}</span>
          </div>
          
          <div className="channel-about-detail-item">
            <span className="channel-about-detail-label">Handle:</span>
            <span className="channel-about-detail-value">@{channelData.channel_tag}</span>
          </div>
          
          <div className="channel-about-detail-item">
            <span className="channel-about-detail-label">Joined:</span>
            <span className="channel-about-detail-value">{createdDate}</span>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="channel-about-section">
        <h2 className="channel-about-heading">Statistics</h2>
        <div className="channel-about-stats">
          <div className="channel-about-stat-card">
            <div className="channel-about-stat-icon">🎥</div>
            <div className="channel-about-stat-info">
              <div className="channel-about-stat-value">{channelStats.totalVideos}</div>
              <div className="channel-about-stat-label">Total Videos</div>
            </div>
          </div>

          <div className="channel-about-stat-card">
            <div className="channel-about-stat-icon">👁️</div>
            <div className="channel-about-stat-info">
              <div className="channel-about-stat-value">{channelStats.totalViews.toLocaleString()}</div>
              <div className="channel-about-stat-label">Total Views</div>
            </div>
          </div>

          <div className="channel-about-stat-card">
            <div className="channel-about-stat-icon">👍</div>
            <div className="channel-about-stat-info">
              <div className="channel-about-stat-value">{channelStats.totalLikes.toLocaleString()}</div>
              <div className="channel-about-stat-label">Total Likes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Links Section (Optional - can be expanded later) */}
      <section className="channel-about-section">
        <h2 className="channel-about-heading">Links</h2>
        <div className="channel-about-links">
          <p className="channel-about-links-empty">No links added yet.</p>
        </div>
      </section>
    </div>
  );
}
