import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          Oops! The page you're looking for doesn't exist. 
          It might have been moved or deleted.
        </p>
        <div className="error-actions">
          <button 
            className="error-button primary"
            onClick={() => navigate('/')}
          >
            Go to Home
          </button>
          <button 
            className="error-button secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
      <div className="error-illustration">
        <svg 
          viewBox="0 0 200 200" 
          className="error-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="80" fill="#f0f0f0" />
          <text 
            x="100" 
            y="120" 
            fontSize="60" 
            textAnchor="middle" 
            fill="#9333ea"
            fontWeight="bold"
          >
            404
          </text>
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
