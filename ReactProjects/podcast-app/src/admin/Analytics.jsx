import React, { useState } from 'react';

const Analytics = () => {
  // Placeholder data for analytics
  const [analyticsData] = useState({
    traffic: 12000,
    complaints: 52,
    comments: 342,
    upvotes: 5678,
    userGrowth: 120, // Monthly new users
  });

  return (
    <div className="analytics-container">
      <h3>Platform Analytics</h3>
      <div className="analytics-card">
        <h4>Traffic</h4>
        <p className="analytics-value">{analyticsData.traffic}</p>
        <p>Monthly Traffic</p>
      </div>
      <div className="analytics-card">
        <h4>Complaints</h4>
        <p className="analytics-value">{analyticsData.complaints}</p>
        <p>Open Complaints</p>
      </div>
      <div className="analytics-card">
        <h4>Comments</h4>
        <p className="analytics-value">{analyticsData.comments}</p>
        <p>Total Comments</p>
      </div>
      <div className="analytics-card">
        <h4>Upvotes</h4>
        <p className="analytics-value">{analyticsData.upvotes}</p>
        <p>Total Upvotes</p>
      </div>
      <div className="analytics-card">
        <h4>User Growth</h4>
        <p className="analytics-value">{analyticsData.userGrowth}</p>
        <p>New Users This Month</p>
      </div>

      <style jsx>{`
        .analytics-container {
          padding: 40px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-width: 1200px;
          margin: auto;
        }

        h3 {
          text-align: center;
          color: #007bff;
          margin-bottom: 40px;
        }

        .analytics-card {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 20%;
          margin: 10px;
        }

        .analytics-value {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-top: 10px;
          margin-bottom: 10px;
        }

        .analytics-card h4 {
          font-size: 20px;
          color: #333;
        }

        .analytics-card p {
          font-size: 14px;
          color: #6c757d;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .analytics-card {
            width: 100%;
            margin-bottom: 10px;
          }
        }

        @media (min-width: 768px) {
          .analytics-card {
            width: 30%;
          }
        }

        @media (min-width: 1200px) {
          .analytics-card {
            width: 20%;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
