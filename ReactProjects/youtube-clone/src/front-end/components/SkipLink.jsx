import React from 'react';
import '../../styles/accessibility.css';

/**
 * SkipLink Component
 * 
 * Provides a "Skip to main content" link for keyboard users
 * to bypass repetitive navigation and jump directly to the main content.
 * 
 * This is essential for accessibility, especially for screen reader users
 * and keyboard-only navigation.
 */
export default function SkipLink() {
  const handleSkip = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a 
      href="#main-content" 
      className="skip-link"
      onClick={handleSkip}
    >
      Skip to main content
    </a>
  );
}
