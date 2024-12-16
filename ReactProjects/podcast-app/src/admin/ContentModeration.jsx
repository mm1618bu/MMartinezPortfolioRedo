import React, { useState } from 'react';

const ContentModeration = () => {
  const [flaggedContent, setFlaggedContent] = useState([
    { id: 1, title: 'Inappropriate Language', user: 'User1', dateReported: '2024-12-01' },
    { id: 2, title: 'Offensive Image', user: 'User2', dateReported: '2024-12-02' },
  ]);

  const [reportedSubmissions, setReportedSubmissions] = useState([
    { id: 1, title: 'Spammed Comment', user: 'User3', dateReported: '2024-12-03' },
  ]);

  const handleApprove = (id) => {
    setFlaggedContent(flaggedContent.filter((content) => content.id !== id));
  };

  const handleDelete = (id) => {
    setFlaggedContent(flaggedContent.filter((content) => content.id !== id));
  };

  const handleResolveReport = (id) => {
    setReportedSubmissions(reportedSubmissions.filter((report) => report.id !== id));
  };

  return (
    <div className="content-moderation-container">
      <h3>Content Moderation</h3>

      <div className="moderation-tools">
        <div className="moderation-section">
          <h4>Flagged Content</h4>
          <table className="content-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>User</th>
                <th>Date Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedContent.map((content) => (
                <tr key={content.id}>
                  <td>{content.title}</td>
                  <td>{content.user}</td>
                  <td>{content.dateReported}</td>
                  <td>
                    <button className="action-button approve-btn" onClick={() => handleApprove(content.id)}>
                      Approve
                    </button>
                    <button className="action-button delete-btn" onClick={() => handleDelete(content.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="moderation-section">
          <h4>Reported Submissions</h4>
          <table className="content-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>User</th>
                <th>Date Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportedSubmissions.map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>{report.user}</td>
                  <td>{report.dateReported}</td>
                  <td>
                    <button className="action-button resolve-btn" onClick={() => handleResolveReport(report.id)}>
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .content-moderation-container {
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-width: 1200px;
          margin: auto;
        }

        h3 {
          text-align: center;
          color: #007bff;
          margin-bottom: 30px;
        }

        .moderation-tools {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .moderation-section {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .content-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .content-table th,
        .content-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .content-table th {
          background-color: #007bff;
          color: white;
        }

        .action-button {
          padding: 8px 15px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          margin-right: 10px;
        }

        .approve-btn {
          background-color: #28a745;
          color: white;
        }

        .approve-btn:hover {
          background-color: #218838;
        }

        .delete-btn {
          background-color: #dc3545;
          color: white;
        }

        .delete-btn:hover {
          background-color: #c82333;
        }

        .resolve-btn {
          background-color: #ffc107;
          color: white;
        }

        .resolve-btn:hover {
          background-color: #e0a800;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content-table th,
          .content-table td {
            font-size: 12px;
          }

          .action-button {
            font-size: 12px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentModeration;
