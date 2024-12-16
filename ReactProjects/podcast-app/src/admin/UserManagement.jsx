import React, { useState } from 'react';

const UserManagement = () => {
  const initialUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator' },
  ];

  const [users, setUsers] = useState(initialUsers); // State to manage users
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [editingUser, setEditingUser] = useState(null); // For editing users
  const [showForm, setShowForm] = useState(false); // Show form for adding/editing users

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value,
    });
  };

  const handleAddUser = () => {
    setUsers([...users, { ...newUser, id: users.length + 1 }]);
    setNewUser({ name: '', email: '', role: '' });
    setShowForm(false);
  };

  const handleEditUser = (id) => {
    const userToEdit = users.find((user) => user.id === id);
    setNewUser({ name: userToEdit.name, email: userToEdit.email, role: userToEdit.role });
    setEditingUser(id);
    setShowForm(true);
  };

  const handleUpdateUser = () => {
    const updatedUsers = users.map((user) =>
      user.id === editingUser ? { ...user, ...newUser } : user
    );
    setUsers(updatedUsers);
    setNewUser({ name: '', email: '', role: '' });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleDeleteUser = (id) => {
    const filteredUsers = users.filter((user) => user.id !== id);
    setUsers(filteredUsers);
  };

  return (
    <div className="user-management-container">
      <h3>User Management</h3>

      <div className="action-buttons">
        <button className="action-button" onClick={() => setShowForm(true)}>
          Add New User
        </button>
      </div>

      <div className="user-list">
        <h4>Existing Users</h4>
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button className="action-button" onClick={() => handleEditUser(user.id)}>
                    Edit
                  </button>
                  <button className="action-button" onClick={() => handleDeleteUser(user.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="user-form">
          <h4>{editingUser ? 'Edit User' : 'Add New User'}</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingUser ? handleUpdateUser() : handleAddUser();
            }}
          >
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Role:
              <select name="role" value={newUser.role} onChange={handleInputChange} required>
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Moderator">Moderator</option>
              </select>
            </label>
            <label>Send Email to user to set password
                <input type="checkbox" name="sendEmail" value={newUser.sendEmail} onChange={handleInputChange} />
            </label>
            <button type="submit">{editingUser ? 'Update User' : 'Add User'}</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .user-management-container {
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-width: 800px;
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

        .user-list {
          margin-top: 20px;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
        }

        .user-table th,
        .user-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .user-table th {
          background-color: #007bff;
          color: white;
        }

        .user-form {
          margin-top: 40px;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .user-form h4 {
          color: #007bff;
          text-align: center;
          margin-bottom: 20px;
        }

        .user-form form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .user-form label {
          font-size: 16px;
          color: #555;
        }

        .user-form input,
        .user-form select {
          padding: 8px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .user-form button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .user-form button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
