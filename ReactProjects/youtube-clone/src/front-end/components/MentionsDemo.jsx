// src/front-end/components/MentionsDemo.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MentionInput from './MentionInput';
import MentionText from './MentionText';
import { extractMentionedChannels } from '../utils/mentionUtils';

/**
 * Demo page showing the mentions feature
 */
export default function MentionsDemo() {
  const [commentText, setCommentText] = useState('');
  const [userName, setUserName] = useState('');
  const [submittedComments, setSubmittedComments] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !userName.trim()) return;

    const mentionedChannels = extractMentionedChannels(commentText);
    
    setSubmittedComments([
      {
        id: Date.now(),
        userName: userName.trim(),
        text: commentText.trim(),
        mentions: mentionedChannels,
        timestamp: new Date()
      },
      ...submittedComments
    ]);

    setCommentText('');
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        borderLeft: '4px solid #1976d2'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#333' }}>
          @Channel Mentions Feature
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
          Test the channel mention system. Type @ in the input below to see autocomplete suggestions.
        </p>
      </div>

      {/* Features List */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#333' }}>
          ✨ Features
        </h2>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
          <li><strong>Autocomplete:</strong> Type @ to trigger channel suggestions</li>
          <li><strong>Keyboard Navigation:</strong> Use ↑↓ arrows to navigate, Enter to select, Esc to cancel</li>
          <li><strong>Smart Filtering:</strong> Searches both channel names and tags</li>
          <li><strong>Clickable Mentions:</strong> Click @mentions in comments to visit channel pages</li>
          <li><strong>Notifications:</strong> Mentioned channels receive notifications (when integrated)</li>
          <li><strong>Multi-mention Support:</strong> Mention multiple channels in one comment</li>
        </ul>
      </div>

      {/* Demo Form */}
      <div style={{
        marginBottom: '30px',
        padding: '25px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
          Try It Out
        </h2>
        <form onSubmit={handleSubmit}>
          <MentionInput
            value={commentText}
            onChange={setCommentText}
            onSubmit={handleSubmit}
            placeholder="Try typing @ to mention a channel..."
            userName={userName}
            onUserNameChange={setUserName}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || !userName.trim()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: commentText.trim() && userName.trim() ? '#1976d2' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: commentText.trim() && userName.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (commentText.trim() && userName.trim()) {
                e.target.style.backgroundColor = '#1565c0';
              }
            }}
            onMouseLeave={(e) => {
              if (commentText.trim() && userName.trim()) {
                e.target.style.backgroundColor = '#1976d2';
              }
            }}
          >
            Post Comment
          </button>
        </form>
      </div>

      {/* Submitted Comments */}
      {submittedComments.length > 0 && (
        <div style={{
          padding: '25px',
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
            Preview Comments ({submittedComments.length})
          </h2>
          {submittedComments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '15px',
                marginBottom: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <strong style={{ color: '#333', fontSize: '14px' }}>
                  {comment.userName}
                </strong>
                <span style={{ color: '#999', fontSize: '12px' }}>
                  {comment.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div style={{
                color: '#555',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '10px'
              }}>
                <MentionText text={comment.text} />
              </div>
              {comment.mentions.length > 0 && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  padding: '8px 10px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <strong>Mentioned channels:</strong>{' '}
                  {comment.mentions.map((tag, idx) => (
                    <span key={idx}>
                      <span
                        onClick={() => navigate(`/channel/${tag}`)}
                        style={{
                          color: '#1976d2',
                          cursor: 'pointer',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        @{tag}
                      </span>
                      {idx < comment.mentions.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => setSubmittedComments([])}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Implementation Notes */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#856404' }}>
          📝 Implementation Notes
        </h3>
        <p style={{ margin: 0, color: '#856404', fontSize: '14px', lineHeight: '1.6' }}>
          The mentions feature is now integrated into the comment system.
          In the VideoPlayer page, you can use @ to mention channels in comments and replies.
          Mentioned channels will receive notifications when the notification system is active.
        </p>
      </div>
    </div>
  );
}
