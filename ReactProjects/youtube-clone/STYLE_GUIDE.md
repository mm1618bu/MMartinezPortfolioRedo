# YouTube Clone - Style Guide

## 🎨 Design System

This style guide defines the visual language and design patterns for the YouTube Clone application.

---

## Color Palette

### Primary Colors
```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--primary-purple: #667eea;
--primary-dark-purple: #764ba2;
```

**Usage:** Primary actions, CTAs, branding elements, gradients

### Neutral Colors
```css
--black: #1a1a1a;
--dark-gray: #2a2a2a;
--medium-gray: #666;
--light-gray: #999;
--border-gray: #e0e0e0;
--background-light: #f8f9fa;
--white: #ffffff;
```

**Usage:** Text, backgrounds, borders, and structural elements

### Semantic Colors
```css
/* Success */
--success-bg: #efe;
--success-text: #3a3;
--success-border: #cfc;

/* Error */
--error-bg: #fee;
--error-text: #c33;
--error-border: #fcc;

/* Warning */
--warning-bg: #fff8e1;
--warning-text: #ff6f00;
--warning-border: #ffd54f;

/* Info */
--info-bg: #e3f2fd;
--info-text: #1976d2;
--info-border: #90caf9;
```

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
```css
--font-xs: 12px;
--font-sm: 13px;
--font-base: 14px;
--font-md: 15px;
--font-lg: 18px;
--font-xl: 22px;
--font-2xl: 24px;
--font-3xl: 28px;
--font-4xl: 36px;
```

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Scale

#### Headings
- **H1**: 28px / 700 weight - Page titles
- **H2**: 22px / 700 weight - Section headers
- **H3**: 18px / 600 weight - Subsection headers
- **H4**: 15px / 600 weight - Card titles

#### Body Text
- **Body Large**: 15px / 400 weight - Primary content
- **Body Regular**: 14px / 400 weight - Secondary content
- **Body Small**: 13px / 400 weight - Captions, metadata
- **Body Tiny**: 12px / 400 weight - Timestamps, labels

---

## Spacing System

### Scale (8px base)
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-base: 16px;
--space-lg: 20px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 40px;
--space-4xl: 48px;
--space-5xl: 64px;
```

### Usage Guidelines
- **Component padding**: 16px - 24px
- **Section spacing**: 32px - 48px
- **Form field gaps**: 20px
- **Button padding**: 12px - 14px vertical, 20px - 24px horizontal
- **Card padding**: 24px - 40px

---

## Border Radius

```css
--radius-sm: 4px;    /* Small elements, tags */
--radius-md: 8px;    /* Buttons, inputs, cards */
--radius-lg: 12px;   /* Large cards */
--radius-xl: 16px;   /* Containers, modals */
--radius-full: 50%;  /* Avatars, circular elements */
```

---

## Shadows

```css
/* Elevation levels */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.3);

/* Interactive shadows */
--shadow-button: 0 4px 12px rgba(102, 126, 234, 0.4);
--shadow-button-hover: 0 6px 20px rgba(102, 126, 234, 0.5);
```

---

## Components

### Buttons

#### Primary Button
```jsx
<button className="btn-primary">
  Click Me
</button>
```
**Style:**
- Background: Primary gradient
- Color: White
- Padding: 14px 24px
- Border-radius: 8px
- Font-weight: 600
- Shadow on hover with lift effect

**States:**
- Hover: Lift with enhanced shadow
- Active: Slight press down
- Disabled: 60% opacity
- Loading: Spinner animation

#### Secondary Button
```jsx
<button className="btn-secondary">
  Cancel
</button>
```
**Style:**
- Background: White
- Color: Primary purple
- Border: 2px solid border-gray
- Hover: Border changes to primary color, light background

#### Block Button
```jsx
<button className="btn-primary btn-block">
  Full Width
</button>
```
**Style:** Full width (100%) button

---

### Form Elements

#### Input Fields
```jsx
<div className="form-group">
  <label htmlFor="email">Email Address</label>
  <input 
    id="email"
    type="email" 
    className="form-input"
    placeholder="Enter your email"
  />
</div>
```

**Style:**
- Padding: 12px 16px
- Border: 2px solid border-gray
- Border-radius: 8px
- Focus: Primary color border with subtle glow
- Placeholder: Light gray text

#### Password Input with Toggle
```jsx
<div className="password-input-wrapper">
  <input type="password" className="form-input" />
  <button type="button" className="password-toggle">
    👁️
  </button>
</div>
```

---

### Alerts

#### Error Alert
```jsx
<div className="alert alert-error">
  <span className="alert-icon">⚠️</span>
  <span>Error message here</span>
</div>
```

#### Success Alert
```jsx
<div className="alert alert-success">
  <span className="alert-icon">✓</span>
  <span>Success message here</span>
</div>
```

**Variants:**
- `alert-error`: Red theme
- `alert-success`: Green theme
- `alert-warning`: Yellow theme
- `alert-info`: Blue theme

---

### Cards

#### Video Card
```jsx
<article className="video-card">
  <div className="video-card-thumbnail-container">
    {/* Thumbnail content */}
  </div>
  <div className="video-card-info">
    {/* Card content */}
  </div>
</article>
```

**Features:**
- 16:9 aspect ratio thumbnail
- Hover effects with scale
- Duration badge
- Privacy badge support
- Keyword tags

#### Auth Card
```jsx
<div className="auth-card">
  <div className="auth-header">
    <h1>Title</h1>
    <p>Description</p>
  </div>
  {/* Card content */}
</div>
```

**Style:**
- Max-width: 480px
- Padding: 40px
- Border-radius: 16px
- Shadow: Extra large
- Centered layout

---

## Animation Guidelines

### Timing Functions
```css
/* Standard */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Deceleration */
--ease-out: cubic-bezier(0, 0, 0.2, 1);

/* Acceleration */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Duration
- **Fast**: 150ms - Small UI changes, hover states
- **Standard**: 200ms - 300ms - Most transitions
- **Slow**: 400ms - 500ms - Page transitions, large movements

### Common Animations

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Slide In
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Scale In
```css
@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
```

#### Spinner
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Layout Guidelines

### Container Widths
```css
--container-sm: 640px;   /* Small content */
--container-md: 768px;   /* Forms, auth pages */
--container-lg: 1024px;  /* Main content */
--container-xl: 1280px;  /* Wide content */
--container-2xl: 1400px; /* Video grids */
```

### Grid System
```css
/* Video Grid */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}
```

### Breakpoints
```css
/* Mobile */
@media (max-width: 600px) { }

/* Tablet */
@media (min-width: 601px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

---

## Icons & Emojis

### Icon Usage
- Use emojis for quick visual indicators
- Icons should be 16px - 24px for inline use
- SVG preferred for custom icons

### Common Icons
- **Success**: ✓
- **Error**: ⚠️
- **Info**: ℹ️
- **Warning**: ⚡
- **Video**: 🎬
- **Eye**: 👁️
- **Star**: ⭐
- **Fire**: 🔥

---

## Accessibility Guidelines

### Contrast Ratios
- **Normal text**: Minimum 4.5:1
- **Large text** (18px+): Minimum 3:1
- **UI elements**: Minimum 3:1

### Focus States
All interactive elements must have visible focus indicators:
```css
element:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
```

### ARIA Labels
Always include aria-labels for icon-only buttons:
```jsx
<button aria-label="Show password">👁️</button>
```

### Keyboard Navigation
- All interactive elements accessible via Tab
- Enter/Space activates buttons
- Escape closes modals/dropdowns

---

## Dark Mode Support

### Color Adaptations
```css
@media (prefers-color-scheme: dark) {
  --background: #1a1a1a;
  --card-background: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #999;
  --border-color: #3a3a3a;
}
```

### Best Practices
- Reduce pure white to off-white (#f0f0f0)
- Increase contrast for readability
- Maintain brand colors for interactive elements
- Test all components in both modes

---

## Responsive Design Principles

### Mobile First
Start with mobile layout, then enhance for larger screens

### Touch Targets
- Minimum 44px × 44px for all interactive elements
- Increase font size to 16px on mobile to prevent zoom

### Content Priority
- Critical actions above the fold
- Progressive disclosure for complex features
- Simplify navigation on mobile

---

## Code Style Guidelines

### CSS Class Naming (BEM-inspired)
```css
/* Block */
.video-card { }

/* Element */
.video-card-thumbnail { }
.video-card-title { }

/* Modifier */
.video-card--featured { }
.btn-primary--large { }
```

### Component Structure
```jsx
// 1. Imports
import React from 'react';

// 2. Component
export default function ComponentName() {
  // 3. Hooks
  const [state, setState] = useState();
  
  // 4. Handlers
  const handleClick = () => { };
  
  // 5. Render
  return (
    <div className="component-name">
      {/* Content */}
    </div>
  );
}
```

---

## Performance Guidelines

### Images
- Use `loading="lazy"` for below-fold images
- Optimize thumbnails (WebP preferred)
- Provide alt text for accessibility

### Animations
- Use `transform` and `opacity` for smooth animations
- Avoid animating `width`, `height`, or `left`/`right`
- Use `will-change` sparingly

### CSS
- Minimize selector specificity
- Group related styles
- Use CSS variables for theming

---

## Testing Checklist

### Visual Testing
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test responsive breakpoints
- [ ] Test dark mode
- [ ] Verify color contrast
- [ ] Check loading states

### Interaction Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Hover states appropriate
- [ ] Click/touch targets adequate
- [ ] Form validation works

### Accessibility Testing
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Alt text for images
- [ ] Proper heading hierarchy

---

## Resources

### Tools
- **Color Contrast Checker**: WebAIM Contrast Checker
- **Accessibility Testing**: WAVE, axe DevTools
- **Performance**: Lighthouse, WebPageTest
- **Design**: Figma, Adobe XD

### Documentation
- [MDN Web Docs](https://developer.mozilla.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Documentation](https://react.dev/)

---

## Version History

**v1.0.0** - January 2026
- Initial style guide
- Modern auth pages design system
- Video grid components
- Dark mode support

---

*This style guide is a living document and should be updated as the design system evolves.*
