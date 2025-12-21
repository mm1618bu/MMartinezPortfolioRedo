# @Channel Mentions - Quick Reference

## 🚀 Quick Start

### Use in Comments
```jsx
// Import components
import MentionInput from './components/MentionInput';
import MentionText from './components/MentionText';

// Input with autocomplete
<MentionInput
  value={text}
  onChange={setText}
  placeholder="Type @ to mention..."
/>

// Display with clickable links
<MentionText text={comment.text} />
```

## 📝 Key Functions

### mentionUtils.js
```javascript
// Parse @mentions from text
parseMentions(text) → Array<{tag, startIndex, endIndex}>

// Get unique channel tags
extractMentionedChannels(text) → Array<string>

// Check if typing mention
getCurrentMention(text, cursorPos) → {prefix, startIndex} | null

// Replace partial mention
replaceMention(text, start, cursor, tag) → {newText, newCursorPosition}

// Render with links
renderMentionsInText(text, onClick) → Array<Element>

// Process and notify
processMentionsAndNotify(text, videoId, userId, getChannel, notify)
```

### supabase.js
```javascript
// Get top channels
getAllChannels(limit = 50) → Promise<Array>

// Search channels
searchChannels(query, limit = 20) → Promise<Array>

// Get channel by tag
getChannelByTagForMention(tag) → Promise<Channel | null>
```

### notificationAPI.js
```javascript
// Send mention notification
notifyChannelMention(
  channelOwnerId,
  actorUserId,
  videoId,
  commentText,
  channelTag
) → Promise
```

## 🎨 Component Props

### MentionInput
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | ✅ | Current text value |
| `onChange` | function | ✅ | Text change handler |
| `onSubmit` | function | ❌ | Form submit handler |
| `placeholder` | string | ❌ | Input placeholder |
| `userName` | string | ❌ | User's name |
| `onUserNameChange` | function | ❌ | Name change handler |
| `disabled` | boolean | ❌ | Disable input |
| `autoFocus` | boolean | ❌ | Auto-focus on mount |

### MentionText
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `text` | string | ✅ | Text with @mentions |
| `style` | object | ❌ | Additional styles |

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `@` | Trigger autocomplete |
| `↑` | Navigate up in suggestions |
| `↓` | Navigate down in suggestions |
| `Enter` | Select current suggestion |
| `Esc` | Close suggestions |

## 🔄 Integration Steps

### 1. Add to Comment Form
```jsx
// Replace old textarea with MentionInput
<MentionInput
  value={comment}
  onChange={setComment}
  userName={userName}
  onUserNameChange={setUserName}
/>
```

### 2. Process on Submit
```jsx
async function handleSubmit() {
  // Submit comment
  await addComment(comment);
  
  // Process mentions
  const user = getUser();
  await processMentionsAndNotify(
    comment,
    videoId,
    user.id,
    getChannelByTagForMention,
    notifyChannelMention
  );
}
```

### 3. Display in Comment
```jsx
// Replace plain text with MentionText
<p>
  <MentionText text={comment.text} />
</p>
```

## 📊 Data Flow

```
User types @ 
  → getCurrentMention() detects it
  → getAllChannels() fetches suggestions
  → filterChannelsForMention() filters results
  → User selects channel
  → replaceMention() inserts @channelTag
  → User submits comment
  → parseMentions() finds all @mentions
  → processMentionsAndNotify() sends notifications
  → MentionText renders clickable links
```

## 🎯 Common Patterns

### Pattern 1: Comment with Mentions
```jsx
function CommentBox() {
  const [text, setText] = useState('');
  
  const handleSubmit = async () => {
    await submitComment(text);
    await processMentionsAndNotify(
      text,
      videoId,
      userId,
      getChannelByTagForMention,
      notifyChannelMention
    );
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <MentionInput value={text} onChange={setText} />
      <button type="submit">Post</button>
    </form>
  );
}
```

### Pattern 2: Display Comment
```jsx
function Comment({ data }) {
  return (
    <div>
      <strong>{data.userName}</strong>
      <p><MentionText text={data.text} /></p>
    </div>
  );
}
```

### Pattern 3: Extract Mentions
```jsx
const text = "Check out @channel1 and @channel2!";
const mentions = extractMentionedChannels(text);
console.log(mentions); // ['channel1', 'channel2']
```

## 🐛 Debug Checklist

- [ ] Autocomplete not showing?
  - Check `getAllChannels()` returns data
  - Verify channels exist in database
  - Check React Query cache

- [ ] Mentions not clickable?
  - Ensure using `MentionText` component
  - Check React Router setup
  - Verify channel routes exist

- [ ] Notifications not sending?
  - Check user preferences allow mentions
  - Verify channel has valid user_id
  - Review console for errors
  - Check notification API permissions

## 📱 Routes

- `/mentions-demo` - Try the feature
- `/watch/:videoId` - Comments with mentions
- `/channel/:channelTag` - Mention click target

## 🔗 Related Files

```
src/
├── front-end/
│   ├── components/
│   │   ├── MentionInput.jsx      # Autocomplete input
│   │   ├── MentionText.jsx       # Display mentions
│   │   ├── MentionsDemo.jsx      # Demo page
│   │   ├── CommentFeed.jsx       # Integrated mentions
│   │   └── CommentItem.jsx       # Display in comments
│   └── utils/
│       ├── mentionUtils.js       # Core utilities
│       ├── supabase.js           # Channel queries
│       └── notificationAPI.js    # Notifications
└── App.js                         # Routes
```

## 💡 Tips

1. **Performance**: Channel list cached 10 minutes
2. **UX**: Autocomplete shows top 10 results
3. **Safety**: Self-mentions don't notify
4. **Async**: Notifications don't block comments
5. **Validation**: Only valid channel tags work

## 📚 Examples

### Example 1: Simple Integration
```jsx
import MentionInput from './components/MentionInput';

export default function MyForm() {
  const [text, setText] = useState('');
  
  return (
    <MentionInput 
      value={text} 
      onChange={setText}
      placeholder="Type @ to mention..."
    />
  );
}
```

### Example 2: With Processing
```jsx
import { processMentionsAndNotify } from './utils/mentionUtils';

async function postComment(text, videoId) {
  // Post comment
  const comment = await addComment(text);
  
  // Process mentions
  const user = getCurrentUser();
  await processMentionsAndNotify(
    text,
    videoId,
    user.id,
    getChannelByTagForMention,
    notifyChannelMention
  ).catch(err => console.error('Mention error:', err));
  
  return comment;
}
```

### Example 3: Display with Custom Styling
```jsx
import MentionText from './components/MentionText';

export default function StyledComment({ comment }) {
  return (
    <div className="comment">
      <MentionText 
        text={comment.text}
        style={{ fontSize: '14px', lineHeight: '1.6' }}
      />
    </div>
  );
}
```

---

**Need Help?** Check [MENTIONS_FEATURE.md](./MENTIONS_FEATURE.md) for full documentation.
