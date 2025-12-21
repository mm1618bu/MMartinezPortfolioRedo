// src/front-end/components/MentionInput.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllChannels, searchChannels } from '../utils/supabase';
import { getCurrentMention, replaceMention, filterChannelsForMention } from '../utils/mentionUtils';

/**
 * Text input with @channel mention autocomplete
 * 
 * Props:
 * - value: Current text value
 * - onChange: Callback when text changes (newValue)
 * - onSubmit: Callback when form is submitted
 * - placeholder: Input placeholder text
 * - userName: Current user's name
 * - onUserNameChange: Callback for username changes
 * - disabled: Whether input is disabled
 * - autoFocus: Whether to auto-focus input
 */
export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a comment...",
  userName = "",
  onUserNameChange = null,
  disabled = false,
  autoFocus = false
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMention, setCurrentMention] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch channels for mention autocomplete
  const { data: channels = [] } = useQuery({
    queryKey: ['channels', 'for-mentions'],
    queryFn: async () => {
      try {
        // Fetch top channels by subscriber count
        return await getAllChannels(100);
      } catch (err) {
        console.error('Error fetching channels:', err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Check for mentions as user types
  useEffect(() => {
    if (!inputRef.current || !value) {
      setShowSuggestions(false);
      return;
    }

    const cursorPosition = inputRef.current.selectionStart;
    const mention = getCurrentMention(value, cursorPosition);

    if (mention && channels.length > 0) {
      setCurrentMention(mention);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setCurrentMention(null);
    }
  }, [value, channels.length]);

  // Filter channels based on current mention prefix
  const filteredChannels = currentMention
    ? filterChannelsForMention(channels, currentMention.prefix)
    : [];

  // Handle selecting a mention from suggestions
  const selectMention = (channel) => {
    if (!currentMention || !inputRef.current) return;

    const cursorPosition = inputRef.current.selectionStart;
    const { newText, newCursorPosition } = replaceMention(
      value,
      currentMention.startIndex,
      cursorPosition,
      channel.channel_tag
    );

    onChange(newText);
    setShowSuggestions(false);
    setCurrentMention(null);

    // Set cursor position after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredChannels.length === 0) {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredChannels.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredChannels.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredChannels[selectedIndex]) {
          selectMention(filteredChannels[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setCurrentMention(null);
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* User Name Input (optional) */}
      {onUserNameChange && (
        <input
          type="text"
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder="Your name..."
          disabled={disabled}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1976d2';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e0e0e0';
          }}
        />
      )}

      {/* Comment Textarea */}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#1976d2';
        }}
        onBlur={(e) => {
          // Delay to allow click on suggestion
          setTimeout(() => {
            e.target.style.borderColor = '#e0e0e0';
            setShowSuggestions(false);
          }, 200);
        }}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredChannels.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {filteredChannels.map((channel, index) => (
            <div
              key={channel.id}
              onClick={() => selectMention(channel)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#f5f5f5' : '#fff',
                borderBottom: index < filteredChannels.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.15s',
              }}
            >
              {/* Channel Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e0e0',
                  backgroundImage: channel.avatar_url 
                    ? `url(${channel.avatar_url})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#666',
                }}
              >
                {!channel.avatar_url && (channel.channel_name?.[0] || '?')}
              </div>

              {/* Channel Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#000',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {channel.channel_name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  @{channel.channel_tag}
                </div>
              </div>

              {/* @ Symbol Indicator */}
              <div
                style={{
                  fontSize: '18px',
                  color: '#1976d2',
                  fontWeight: 'bold',
                }}
              >
                @
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hint Text */}
      <div
        style={{
          marginTop: '6px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        Type @ to mention a channel
      </div>
    </div>
  );
}
