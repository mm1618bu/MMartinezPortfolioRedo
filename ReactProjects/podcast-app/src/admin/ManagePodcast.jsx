import React, { useState } from 'react';

const ManagePodcast = () => {
  const initialPodcasts = [
    {
      id: 1,
      podcastName: 'Tech Talks',
      description: 'A podcast about the latest in technology.',
      category: 'Technology',
      subcategory: 'Gadgets',
      rating: '5/5',
      hosts: 'John Doe, Jane Smith',
      length: '45 minutes',
      language: 'English',
      audience: '5000',
      subscriptionPlan: 'Premium',
    },
    {
      id: 2,
      podcastName: 'Health Matters',
      description: 'Discussing health tips and wellness.',
      category: 'Health',
      subcategory: 'Mental Health',
      rating: '4.5/5',
      hosts: 'Bob Johnson',
      length: '30 minutes',
      language: 'English',
      audience: '3000',
      subscriptionPlan: 'Basic',
    },
  ];

  const [podcasts, setPodcasts] = useState(initialPodcasts);
  const [newPodcast, setNewPodcast] = useState({
    podcastName: '',
    description: '',
    category: '',
    subcategory: '',
    rating: '',
    hosts: '',
    length: '',
    language: '',
    audience: '',
    subscriptionPlan: '',
  });
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPodcast({
      ...newPodcast,
      [name]: value,
    });
  };

  const handleAddPodcast = () => {
    setPodcasts([...podcasts, { ...newPodcast, id: podcasts.length + 1 }]);
    setNewPodcast({
      podcastName: '',
      description: '',
      category: '',
      subcategory: '',
      rating: '',
      hosts: '',
      length: '',
      language: '',
      audience: '',
      subscriptionPlan: '',
    });
    setShowForm(false);
  };

  const handleEditPodcast = (id) => {
    const podcastToEdit = podcasts.find((podcast) => podcast.id === id);
    setNewPodcast(podcastToEdit);
    setEditingPodcast(id);
    setShowForm(true);
  };

  const handleUpdatePodcast = () => {
    const updatedPodcasts = podcasts.map((podcast) =>
      podcast.id === editingPodcast ? { ...podcast, ...newPodcast } : podcast
    );
    setPodcasts(updatedPodcasts);
    setNewPodcast({
      podcastName: '',
      description: '',
      category: '',
      subcategory: '',
      rating: '',
      hosts: '',
      length: '',
      language: '',
      audience: '',
      subscriptionPlan: '',
    });
    setEditingPodcast(null);
    setShowForm(false);
  };

  const handleDeletePodcast = (id) => {
    const filteredPodcasts = podcasts.filter((podcast) => podcast.id !== id);
    setPodcasts(filteredPodcasts);
  };

  return (
    <div className="manage-podcast-container">
      <h3>Manage Podcasts</h3>

      <div className="action-buttons">
        <button className="action-button" onClick={() => setShowForm(true)}>
          Add New Podcast
        </button>
      </div>

      <div className="podcast-list">
        <h4>Existing Podcasts</h4>
        <table className="podcast-table">
          <thead>
            <tr>
              <th>Podcast Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {podcasts.map((podcast) => (
              <tr key={podcast.id}>
                <td>{podcast.podcastName}</td>
                <td>{podcast.description}</td>
                <td>{podcast.category}</td>
                <td>
                  <button className="action-button" onClick={() => handleEditPodcast(podcast.id)}>
                    Edit
                  </button>
                  <button className="action-button" onClick={() => handleDeletePodcast(podcast.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="podcast-form">
          <h4>{editingPodcast ? 'Edit Podcast' : 'Add New Podcast'}</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingPodcast ? handleUpdatePodcast() : handleAddPodcast();
            }}
          >
            <label>
              Podcast Name:
              <input
                type="text"
                name="podcastName"
                value={newPodcast.podcastName}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Description:
              <textarea
                name="description"
                value={newPodcast.description}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Category:
              <input
                type="text"
                name="category"
                value={newPodcast.category}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Subcategory:
              <input
                type="text"
                name="subcategory"
                value={newPodcast.subcategory}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Rating:
              <input
                type="text"
                name="rating"
                value={newPodcast.rating}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Hosts:
              <input
                type="text"
                name="hosts"
                value={newPodcast.hosts}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Expected Length:
              <input
                type="text"
                name="length"
                value={newPodcast.length}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Language:
              <input
                type="text"
                name="language"
                value={newPodcast.language}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Max Audience:
              <input
                type="number"
                name="audience"
                value={newPodcast.audience}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Subscription Plan:
              <select
                name="subscriptionPlan"
                value={newPodcast.subscriptionPlan}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Plan</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <button type="submit">{editingPodcast ? 'Update Podcast' : 'Add Podcast'}</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .manage-podcast-container {
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-width: 900px;
          margin: auto;
        }

        h3 {
          text-align: center;
          color: #007bff;
        }

        .action-buttons {
          text-align: center;
          margin-bottom: 20px;
        }

        .action-button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin: 0 10px;
        }

        .action-button:hover {
          background-color: #0056b3;
        }

        .podcast-list {
          margin-top: 20px;
        }

        .podcast-table {
          width: 100%;
          border-collapse: collapse;
        }

        .podcast-table th,
        .podcast-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .podcast-table th {
          background-color: #007bff;
          color: white;
        }

        .podcast-form {
          margin-top: 40px;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .podcast-form h4 {
          color: #007bff;
          text-align: center;
          margin-bottom: 20px;
        }

        .podcast-form form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .podcast-form label {
          font-size: 16px;
          color: #555;
        }

        .podcast-form input,
        .podcast-form select,
        .podcast-form textarea {
          padding: 8px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .podcast-form button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .podcast-form button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default ManagePodcast;
