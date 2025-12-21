// src/front-end/components/MentionText.jsx
import { useNavigate } from 'react-router-dom';
import { renderMentionsInText } from '../utils/mentionUtils';

/**
 * Component that renders text with clickable @channel mentions
 * 
 * Props:
 * - text: Text containing @mentions
 * - style: Additional styles for the container
 */
export default function MentionText({ text, style = {} }) {
  const navigate = useNavigate();

  const handleMentionClick = (channelTag) => {
    // Navigate to channel page
    navigate(`/channel/${channelTag}`);
  };

  const elements = renderMentionsInText(text, handleMentionClick);

  return (
    <span style={style}>
      {elements.map((element, index) => {
        if (typeof element === 'string') {
          return <span key={`text-${index}`}>{element}</span>;
        }
        
        if (element.type === 'mention') {
          return (
            <span
              key={element.key}
              onClick={() => handleMentionClick(element.tag)}
              style={{
                color: '#1976d2',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
                e.target.style.color = '#1565c0';
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
                e.target.style.color = '#1976d2';
              }}
            >
              {element.text}
            </span>
          );
        }
        
        return null;
      })}
    </span>
  );
}
