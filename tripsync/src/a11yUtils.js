/**
 * Accessibility Utilities for TripSync
 * Implements NFR-4.1: Keyboard navigation
 * Implements NFR-4.2: Labels and alt text
 * Implements NFR-4.3: Color contrast compliance
 */

/**
 * Handle keyboard event for accessible dropdowns
 * Supports Enter, Space, Escape, Arrow keys
 * Implements NFR-4.1: Full keyboard navigation
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Function} onOpen - Function to open dropdown
 * @param {Function} onClose - Function to close dropdown
 * @param {Function} onSelect - Function to select item (index)
 * @param {number} currentIndex - Current selection index
 * @param {number} itemCount - Total items in dropdown
 * @param {boolean} isOpen - Whether dropdown is open
 */
export const handleDropdownKeyboard = (
  event,
  onOpen,
  onClose,
  onSelect,
  currentIndex = 0,
  itemCount = 0,
  isOpen = false
) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (isOpen) {
        onSelect(currentIndex);
        onClose();
      } else {
        onOpen();
      }
      break;

    case 'Escape':
      event.preventDefault();
      onClose();
      break;

    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen) {
        onOpen();
      } else if (currentIndex < itemCount - 1) {
        onSelect(currentIndex + 1);
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      if (!isOpen) {
        onOpen();
      } else if (currentIndex > 0) {
        onSelect(currentIndex - 1);
      }
      break;

    default:
      break;
  }
};

/**
 * Check if element should be keyboard accessible
 * NFR-4.1: Ensure all interactive elements are keyboard accessible
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - True if element is keyboard accessible
 */
export const isKeyboardAccessible = (element) => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');
  const isNaturallyFocusable = [
    'button',
    'a',
    'input',
    'textarea',
    'select'
  ].includes(tagName);

  // Element is focusable if it's naturally focusable or has tabindex >= 0
  return isNaturallyFocusable || (tabIndex && parseInt(tabIndex) >= 0);
};

/**
 * Manage focus on element
 * NFR-4.1: Keyboard navigation - manage focus
 * @param {HTMLElement} element - The element to focus
 * @param {number} delay - Delay before focusing (default: 0)
 */
export const setFocus = (element, delay = 0) => {
  if (!element) return;

  if (delay > 0) {
    setTimeout(() => element.focus(), delay);
  } else {
    element.focus();
  }
};

/**
 * Generate unique ID
 * Useful for linking labels to inputs
 * NFR-4.2: Labels must be associated with inputs
 * @param {string} prefix - Prefix for the ID
 * @returns {string} - Unique ID
 */
export const generateId = (prefix = 'a11y') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate color contrast ratio
 * NFR-4.3: Check WCAG 2.1 AA compliance
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} - Contrast ratio
 */
export const getContrastRatio = (foreground, background) => {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  const fgLum = getRelativeLuminance(fg);
  const bgLum = getRelativeLuminance(bg);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color code
 * @returns {object} - RGB color object
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Get relative luminance of color
 * Used for WCAG contrast calculation
 * @param {object} rgb - RGB color object
 * @returns {number} - Relative luminance
 */
export const getRelativeLuminance = (rgb) => {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Check if contrast meets WCAG AA standard
 * NFR-4.3: All colors must meet WCAG 2.1 AA standards
 * @param {number} ratio - Contrast ratio
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {boolean} - True if ratio meets AA standard
 */
export const meetsWCAGAA = (ratio, size = 'normal') => {
  // WCAG AA: 4.5:1 for normal text, 3:1 for large text
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Check if contrast meets WCAG AAA standard
 * @param {number} ratio - Contrast ratio
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {boolean} - True if ratio meets AAA standard
 */
export const meetsWCAGAAA = (ratio, size = 'normal') => {
  // WCAG AAA: 7:1 for normal text, 4.5:1 for large text
  return size === 'large' ? ratio >= 4.5 : ratio >= 7;
};

/**
 * Announce message to screen readers
 * NFR-4.1: Keyboard/screen reader users should be notified of dynamic changes
 * @param {string} message - Message to announce
 * @param {string} politeness - 'polite' or 'assertive' (default: 'polite')
 */
export const announceToScreenReaders = (message, politeness = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Create accessible button with proper ARIA attributes
 * NFR-4.1: Ensure buttons are accessible
 * @param {object} props - Button properties
 * @returns {object} - Button accessible props
 */
export const createAccessibleButton = (props = {}) => {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-pressed': props['aria-pressed'] || undefined,
    'aria-expanded': props['aria-expanded'] || undefined,
    'aria-label': props['aria-label'] || undefined,
    ...props
  };
};

/**
 * Create accessible form field
 * NFR-4.2: All form inputs must have associated labels
 * @param {string} label - Label text
 * @param {string} inputId - Input element ID
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {boolean} required - Is field required
 * @param {string} ariaDescribedBy - ID of element describing the field
 * @returns {object} - Accessible form field props
 */
export const createAccessibleFormField = (
  label,
  inputId,
  type = 'text',
  required = false,
  ariaDescribedBy = null
) => {
  return {
    inputProps: {
      id: inputId,
      type,
      required,
      'aria-describedby': ariaDescribedBy || undefined,
      'aria-required': required,
      'aria-label': label
    },
    labelProps: {
      htmlFor: inputId,
      required
    }
  };
};

/**
 * Trap focus within element (e.g., modal)
 * NFR-4.1: Prevent keyboard from leaving a modal
 * @param {HTMLElement} element - The element to trap focus within
 * @param {KeyboardEvent} event - Keyboard event
 */
export const trapFocus = (element, event) => {
  if (event.key !== 'Tab') return;

  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey) {
    // Shift + Tab
    if (activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * Skip to main content link for keyboard navigation
 * NFR-4.1: Allow users to skip navigation
 * @returns {JSX.Element} - Skip link component props
 */
export const createSkipLink = () => {
  return {
    href: '#main-content',
    className: 'skip-link',
    children: 'Skip to main content',
    onClick: (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView();
      }
    }
  };
};

export default {
  handleDropdownKeyboard,
  isKeyboardAccessible,
  setFocus,
  generateId,
  getContrastRatio,
  hexToRgb,
  getRelativeLuminance,
  meetsWCAGAA,
  meetsWCAGAAA,
  announceToScreenReaders,
  createAccessibleButton,
  createAccessibleFormField,
  trapFocus,
  createSkipLink
};
