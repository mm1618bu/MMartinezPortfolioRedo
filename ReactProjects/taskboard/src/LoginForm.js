import React, { useState } from 'react';
import './LoginForm.css'; // Assuming the CSS is in LoginForm.css

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted', formData);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome In!</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username" className="input-icon">
              <i className="fas fa-user"></i> {/* User icon */}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username or Email"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="remember-me">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="rememberMe">Remember Me</label>
          </div>
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        <div className="login-links">
          <a href="#">I Forgot My Password</a>
          <br />
          <a href="#">I don't have an account</a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
