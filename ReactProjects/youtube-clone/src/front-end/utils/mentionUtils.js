// src/front-end/utils/mentionUtils.js

/**
 * Utility functions for handling @channel mentions in comments
 */

/**
 * Parse text to find all @channel mentions
 * @param {string} text - The text to parse
 * @returns {Array} Array of mention objects with { tag, startIndex, endIndex }
 */
export function parseMentions(text) {
  if (!text) return [];
  
  // Match @channelTag pattern (alphanumeric, underscore, hyphen)
  const mentionRegex = /@([\w-]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      tag: match[1], // Channel tag without @
      fullMatch: match[0], // Full @channelTag
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return mentions;
}

/**
 * Extract unique channel tags from text
 * @param {string} text - The text to parse
 * @returns {Array} Array of unique channel tags (without @)
 */
export function extractMentionedChannels(text) {
  const mentions = parseMentions(text);
  const uniqueTags = [...new Set(mentions.map(m => m.tag))];
  return uniqueTags;
}

/**
 * Check if cursor is currently typing a mention
 * @param {string} text - Current text
 * @param {number} cursorPosition - Cursor position in text
 * @returns {Object|null} { prefix: string, startIndex: number } or null
 */
export function getCurrentMention(text, cursorPosition) {
  if (!text || cursorPosition === 0) return null;
  
  // Look backwards from cursor for @ symbol
  let startIndex = cursorPosition - 1;
  
  // Find the start of the mention (@ symbol)
  while (startIndex >= 0 && text[startIndex] !== '@' && text[startIndex] !== ' ') {
    startIndex--;
  }
  
  if (startIndex < 0 || text[startIndex] !== '@') {
    return null;
  }
  
  // Extract the partial mention text
  const mentionText = text.substring(startIndex + 1, cursorPosition);
  
  // Only valid if it's alphanumeric/underscore/hyphen
  if (/^[\w-]*$/.test(mentionText)) {
    return {
      prefix: mentionText,
      startIndex: startIndex
    };
  }
  
  return null;
}

/**
 * Replace mention text at cursor position
 * @param {string} text - Current text
 * @param {number} startIndex - Start index of mention
 * @param {number} cursorPosition - Current cursor position
 * @param {string} channelTag - Channel tag to insert
 * @returns {Object} { newText, newCursorPosition }
 */
export function replaceMention(text, startIndex, cursorPosition, channelTag) {
  const before = text.substring(0, startIndex);
  const after = text.substring(cursorPosition);
  const newText = `${before}@${channelTag} ${after}`;
  const newCursorPosition = startIndex + channelTag.length + 2; // +2 for @ and space
  
  return { newText, newCursorPosition };
}

/**
 * Render text with clickable mention links
 * @param {string} text - Text containing mentions
 * @param {Function} onMentionClick - Callback when mention is clicked
 * @returns {Array} Array of React elements (text and mention links)
 */
export function renderMentionsInText(text, onMentionClick = null) {
  if (!text) return [];
  
  const mentions = parseMentions(text);
  if (mentions.length === 0) return [text];
  
  const elements = [];
  let lastIndex = 0;
  
  mentions.forEach((mention, idx) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      elements.push(text.substring(lastIndex, mention.startIndex));
    }
    
    // Add mention as clickable link
    const mentionElement = {
      type: 'mention',
      key: `mention-${idx}`,
      tag: mention.tag,
      text: mention.fullMatch,
      onClick: onMentionClick
    };
    
    elements.push(mentionElement);
    lastIndex = mention.endIndex;
  });
  
  // Add remaining text after last mention
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }
  
  return elements;
}

/**
 * Validate channel tag format
 * @param {string} tag - Channel tag to validate
 * @returns {boolean} True if valid
 */
export function isValidChannelTag(tag) {
  // Must be 3-30 characters, alphanumeric, underscore, or hyphen
  return /^[\w-]{3,30}$/.test(tag);
}

/**
 * Filter channels based on search query
 * @param {Array} channels - Array of channel objects
 * @param {string} query - Search query
 * @returns {Array} Filtered channels
 */
export function filterChannelsForMention(channels, query) {
  if (!query) return channels.slice(0, 10); // Return top 10 if no query
  
  const lowerQuery = query.toLowerCase();
  
  return channels
    .filter(channel => {
      const tag = (channel.channel_tag || '').toLowerCase();
      const name = (channel.channel_name || '').toLowerCase();
      return tag.includes(lowerQuery) || name.includes(lowerQuery);
    })
    .slice(0, 10); // Limit to 10 suggestions
}

/**
 * Process mentions in comment and send notifications
 * @param {string} commentText - Comment text with mentions
 * @param {string} videoId - Video ID where comment was posted
 * @param {string} actorUserId - User ID of person who posted comment
 * @param {Function} getChannelByTag - Function to fetch channel by tag
 * @param {Function} notifyChannelMention - Function to send notification
 */
export async function processMentionsAndNotify(
  commentText, 
  videoId, 
  actorUserId,
  getChannelByTag,
  notifyChannelMention
) {
  try {
    // Extract all mentioned channel tags
    const mentionedTags = extractMentionedChannels(commentText);
    
    if (mentionedTags.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    // Get channel details for each mention
    const notificationPromises = mentionedTags.map(async (tag) => {
      try {
        // Fetch channel to get owner user ID
        const channel = await getChannelByTag(tag);
        
        if (!channel) {
          console.warn(`Channel @${tag} not found`);
          return null;
        }

        // Don't notify if user mentioned themselves
        if (channel.user_id === actorUserId) {
          return null;
        }

        // Send mention notification
        await notifyChannelMention(
          channel.user_id,
          actorUserId,
          videoId,
          commentText,
          tag
        );

        return channel.id;
      } catch (err) {
        console.error(`Error notifying mention @${tag}:`, err);
        return null;
      }
    });

    // Wait for all notifications to complete
    const results = await Promise.all(notificationPromises);
    const notifiedCount = results.filter(r => r !== null).length;

    return { success: true, notifiedCount };
  } catch (err) {
    console.error('Error processing mentions:', err);
    return { success: false, error: err.message, notifiedCount: 0 };
  }
}

