# ♿ Accessibility Quick Reference

## Common Patterns & Code Snippets

### Buttons with ARIA Labels
```jsx
// Like button
<button
  aria-label="Like this video, 1,234 likes"
  aria-pressed={isLiked}
  onClick={handleLike}
>
  <span aria-hidden="true">👍</span>
  <span>{likeCount}</span>
</button>

// Menu toggle
<button
  aria-label="Open user menu"
  aria-expanded={isOpen}
  aria-haspopup="menu"
  onClick={toggleMenu}
>
  Menu
</button>

// Close button
<button
  aria-label="Close dialog"
  onClick={closeDialog}
>
  <span aria-hidden="true">×</span>
</button>
```

### Images with Alt Text
```jsx
// Thumbnail
<img
  src={video.thumbnail_url}
  alt={`Thumbnail for ${video.title}`}
  loading="lazy"
/>

// Decorative image (no alt needed)
<img
  src={decorative.png}
  alt=""
  role="presentation"
/>

// Avatar
<img
  src={user.avatar}
  alt={`${user.name}'s profile picture`}
/>
```

### Form Fields
```jsx
// Text input
<div className="form-field">
  <label htmlFor="email" className="required">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby="email-help email-error"
    value={email}
    onChange={handleChange}
  />
  <p id="email-help" className="help-text">
    We'll send verification to this email
  </p>
  {hasError && (
    <p id="email-error" role="alert" className="error-message">
      ⚠️ Please enter a valid email address
    </p>
  )}
</div>

// Checkbox
<div className="checkbox-field">
  <input
    id="terms"
    type="checkbox"
    aria-required="true"
    checked={agreed}
    onChange={handleCheck}
  />
  <label htmlFor="terms">
    I agree to the terms and conditions
  </label>
</div>

// Select dropdown
<div className="form-field">
  <label htmlFor="category">Video Category</label>
  <select
    id="category"
    aria-label="Select video category"
    value={category}
    onChange={handleChange}
  >
    <option value="">Choose a category</option>
    <option value="gaming">Gaming</option>
    <option value="music">Music</option>
  </select>
</div>
```

### Navigation
```jsx
// Main navigation
<nav role="navigation" aria-label="Main navigation">
  <ul role="list">
    <li>
      <a href="/" aria-current="page">Home</a>
    </li>
    <li>
      <a href="/videos">Videos</a>
    </li>
  </ul>
</nav>

// Breadcrumb navigation
<nav aria-label="Breadcrumb">
  <ol role="list">
    <li><a href="/">Home</a></li>
    <li><a href="/videos">Videos</a></li>
    <li aria-current="page">Video Title</li>
  </ol>
</nav>
```

### Modals/Dialogs
```jsx
function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <h2 id="modal-title">{title}</h2>
      <button
        aria-label="Close dialog"
        onClick={onClose}
      >
        ×
      </button>
      <div>{children}</div>
    </div>
  );
}
```

### Menus
```jsx
<div role="menu" aria-label="User menu">
  <button
    role="menuitem"
    tabIndex={0}
    onClick={handleProfile}
  >
    Profile
  </button>
  <button
    role="menuitem"
    tabIndex={0}
    onClick={handleSettings}
  >
    Settings
  </button>
  <button
    role="menuitem"
    tabIndex={0}
    onClick={handleLogout}
  >
    Logout
  </button>
</div>
```

### Tabs
```jsx
function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div role="tablist" aria-label="Video information tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === index ? 0 : -1}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== index}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Loading States
```jsx
// Loading button
<button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-live="polite"
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Loading container
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? (
    <p>Loading content...</p>
  ) : (
    <Content />
  )}
</div>
```

### Alerts & Notifications
```jsx
// Success message
<div role="alert" aria-live="polite" className="success-message">
  ✓ Video uploaded successfully!
</div>

// Error message
<div role="alert" aria-live="assertive" className="error-message">
  ⚠️ Upload failed. Please try again.
</div>

// Info message
<div role="status" aria-live="polite">
  Processing video...
</div>
```

### Keyboard Navigation
```jsx
// Clickable card with keyboard support
<article
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label={`Watch ${video.title}`}
>
  {/* Card content */}
</article>

// List navigation
<ul
  role="listbox"
  aria-label="Video list"
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') {
      focusNextItem();
    } else if (e.key === 'ArrowUp') {
      focusPreviousItem();
    }
  }}
>
  {items.map((item) => (
    <li
      key={item.id}
      role="option"
      tabIndex={0}
      aria-selected={selected === item.id}
    >
      {item.title}
    </li>
  ))}
</ul>
```

### Focus Management
```jsx
// Focus trap for modals
import FocusTrap from 'focus-trap-react';

<FocusTrap active={isModalOpen}>
  <div role="dialog">
    {/* Modal content */}
  </div>
</FocusTrap>

// Auto-focus on mount
const inputRef = useRef(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

<input ref={inputRef} />

// Save and restore focus
const previousFocus = useRef(null);

useEffect(() => {
  if (isModalOpen) {
    previousFocus.current = document.activeElement;
  } else if (previousFocus.current) {
    previousFocus.current.focus();
  }
}, [isModalOpen]);
```

### Progress Indicators
```jsx
// Determinate progress
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
>
  <div style={{ width: `${progress}%` }} />
</div>

// Indeterminate progress
<div
  role="progressbar"
  aria-label="Loading"
  aria-busy="true"
>
  <div className="spinner" />
</div>
```

### Video Player
```jsx
<video
  controls
  aria-label={`Video player: ${video.title}`}
  poster={video.thumbnail}
  src={video.url}
>
  <track
    kind="captions"
    src={video.subtitles}
    srcLang="en"
    label="English"
    default
  />
  Your browser doesn't support video playback.
</video>
```

---

## CSS Utilities

```css
/* Visually hidden but accessible */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible */
*:focus-visible {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}

/* Required field indicator */
.required::after {
  content: " *";
  color: #dc2626;
}

/* Error state */
[aria-invalid="true"] {
  border-color: #dc2626;
  border-width: 2px;
}

/* Disabled state */
:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Testing Checklist

- [ ] All interactive elements have ARIA labels
- [ ] All images have alt text (or alt="" for decorative)
- [ ] Forms have associated labels
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape, Arrows)
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Semantic HTML elements used
- [ ] Skip link implemented
- [ ] Landmark regions defined
- [ ] Error messages are accessible
- [ ] Loading states announced
- [ ] Modals trap focus
- [ ] Screen reader tested

---

## Screen Reader Commands

### NVDA (Windows)
- `NVDA + Down Arrow` - Read next item
- `NVDA + Up Arrow` - Read previous item
- `H` - Next heading
- `Shift + H` - Previous heading
- `B` - Next button
- `F` - Next form field
- `K` - Next link

### VoiceOver (Mac)
- `VO + Right Arrow` - Next item
- `VO + Left Arrow` - Previous item
- `VO + Cmd + H` - Next heading
- `VO + Cmd + J` - Next button
- `VO + Cmd + L` - Next link

### JAWS (Windows)
- `Down Arrow` - Next item
- `Up Arrow` - Previous item
- `H` - Next heading
- `B` - Next button
- `F` - Next form field

---

## Common Mistakes to Avoid

❌ **Don't do this:**
```jsx
<div onClick={handleClick}>Click me</div>
<img src="photo.jpg" />
<input /> {/* No label */}
<button>❤️</button> {/* Icon only, no label */}
```

✅ **Do this instead:**
```jsx
<button onClick={handleClick}>Click me</button>
<img src="photo.jpg" alt="Beach sunset" />
<label htmlFor="name">Name</label>
<input id="name" />
<button aria-label="Like this video">❤️</button>
```

---

## Resources

- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Style Guide](https://a11y-style-guide.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Remember**: Test with real users and assistive technologies whenever possible!
