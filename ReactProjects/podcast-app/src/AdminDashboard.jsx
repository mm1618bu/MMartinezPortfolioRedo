import React, { useState } from 'react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('managePodcasts'); // Track active tab
  const [showNewPodcastForm, setShowNewPodcastForm] = useState(false); // Show New Podcast Form
  const [formData, setFormData] = useState({
    podcastName: '',
    podcastDescription: '',
    category: '',
    subcategory: '',
    rating: '',
    hosts: '',
    expectedLength: '',
    fccRegulated: false,
    language: '',
    adaCompliance: false,
    maxAudience: '',
    subscriptionPlan: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    alert('New Podcast Created!');
    setShowNewPodcastForm(false); // Hide the form after submission
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'managePodcasts':
        return (
          <div className="tool-content">
            <h4>Manage Podcasts</h4>
            <div className="action-buttons">
              <button className="action-button" onClick={() => setShowNewPodcastForm(true)}>
                Add New Podcast
              </button>
              <button className="action-button">Edit Existing Podcasts</button>
              <button className="action-button">Delete Podcast</button>
            </div>
            {showNewPodcastForm && (
              <div className="new-podcast-form">
                <h3>Create a New Podcast</h3>
                <form onSubmit={handleSubmit}>
                  <label>
                    Podcast Name:
                    <input
                      type="text"
                      name="podcastName"
                      value={formData.podcastName}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Podcast Description:
                    <textarea
                      name="podcastDescription"
                      value={formData.podcastDescription}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Category:
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Subcategory:
                    <input
                      type="text"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Rating:
                    <input
                      type="text"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Host(s):
                    <input
                      type="text"
                      name="hosts"
                      value={formData.hosts}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Expected Length of Show:
                    <input
                      type="text"
                      name="expectedLength"
                      value={formData.expectedLength}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    FCC Regulated?
                    <input
                      type="checkbox"
                      name="fccRegulated"
                      checked={formData.fccRegulated}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label>
                    Language:
                    <input
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    ADA Compliance?
                    <input
                      type="checkbox"
                      name="adaCompliance"
                      checked={formData.adaCompliance}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label>
                    Max Audience:
                    <input
                      type="number"
                      name="maxAudience"
                      value={formData.maxAudience}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Subscription Plan:
                    <select
                      name="subscriptionPlan"
                      value={formData.subscriptionPlan}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Plan</option>
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </label>
                  <button type="submit">Create Podcast</button>
                </form>
              </div>
            )}
          </div>
        );
      case 'manageUsers':
        return (
          <div className="tool-content">
            <h4>User Management</h4>
            <div className="action-buttons">
              <button className="action-button">Add New User</button>
              <button className="action-button">Edit Existing Users</button>
              <button className="action-button">Delete User</button>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="tool-content">
            <h4>Analytics</h4>
            <div className="action-buttons">
              <button className="action-button">View Total Listeners</button>
              <button className="action-button">Active Podcasts</button>
              <button className="action-button">Revenue Reports</button>
              <button className="action-button">User Growth</button>
            </div>
          </div>
        );
      case 'contentModeration':
        return (
          <div className="tool-content">
            <h4>Content Moderation</h4>
            <div className="action-buttons">
              <button className="action-button">Flagged Content</button>
              <button className="action-button">Report Submissions</button>
              <button className="action-button">Approve Content</button>
              <button className="action-button">Delete Content</button>
            </div>
          </div>
        );
      case 'systemSettings':
        return (
          <div className="tool-content">
            <h4>System Settings</h4>
            <div className="action-buttons">
              <button className="action-button">Configure System</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-layout">
        {/* Left-side tabs */}
        <div className="tab-menu">
          <div
            className={`tab-item ${activeTab === 'managePodcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('managePodcasts')}
          >
            Manage Podcasts
          </div>
          <div
            className={`tab-item ${activeTab === 'manageUsers' ? 'active' : ''}`}
            onClick={() => setActiveTab('manageUsers')}
          >
            User Management
          </div>
          <div
            className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </div>
          <div
            className={`tab-item ${activeTab === 'contentModeration' ? 'active' : ''}`}
            onClick={() => setActiveTab('contentModeration')}
          >
            Content Moderation
          </div>
          <div
            className={`tab-item ${activeTab === 'systemSettings' ? 'active' : ''}`}
            onClick={() => setActiveTab('systemSettings')}
          >
            System Settings
          </div>
        </div>

        {/* Right-side content */}
        <div className="tab-content">
          {renderContent()}
        </div>
      </div>

      <style jsx>{`
        .admin-dashboard {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          background-color: #f8f9fa;
          color: #333;
          min-height: 100vh;
        }

        h1 {
          text-align: center;
          margin-bottom: 40px;
          color: #007bff;
        }

        .dashboard-layout {
          display: flex;
          min-height: 600px;
        }

        .tab-menu {
          width: 220px;
          background-color: #007bff;
          border-radius: 8px;
          padding: 20px;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .tab-item {
          font-size: 18px;
          padding: 15px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          border-radius: 5px;
          margin-bottom: 10px;
        }

        .tab-item:hover {
          background-color: #0056b3;
        }

        .tab-item.active {
          background-color: #0056b3;
          font-weight: bold;
        }

        .tab-content {
          flex-grow: 1;
          margin-left: 20px;
          background-color: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .new-podcast-form {
          margin-top: 40px;
        }

        .new-podcast-form form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .new-podcast-form label {
          font-size: 16px;
          color: #555;
        }

        .new-podcast-form input,
        .new-podcast-form select,
        .new-podcast-form textarea {
          padding: 8px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .new-podcast-form button {
          background-color: #007bff;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .new-podcast-form button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
