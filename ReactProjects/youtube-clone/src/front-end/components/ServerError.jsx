import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServerError = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-code error-code-500">500</div>
        <h1 className="error-title">Server Error</h1>
        <p className="error-message">
          Something went wrong on our end. We're working to fix the issue.
          Please try again later.
        </p>
        <div className="error-actions">
          <button 
            className="error-button primary"
            onClick={handleRefresh}
          >
            Refresh Page
          </button>
          <button 
            className="error-button secondary"
            onClick={() => navigate('/')}
          >
            Go to Home
          </button>
        </div>
      </div>
      <div className="error-illustration">
        <svg 
          viewBox="0 0 200 200" 
          className="error-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="80" fill="#fef2f2" />
          <text 
            x="100" 
            y="120" 
            fontSize="60" 
            textAnchor="middle" 
            fill="#dc2626"
            fontWeight="bold"
          >
            500
          </text>
        </svg>
      </div>
    </div>
  );
};

export default ServerError;
