/**
 * Skip Link Component
 *
 * Provides a "Skip to main content" link that is visible only when focused.
 * This helps keyboard users bypass repetitive navigation and jump directly to the main content.
 *
 * WCAG 2.4.1 Bypass Blocks (Level A)
 */

import React from 'react';

interface SkipLinkProps {
  /**
   * The ID of the main content element to skip to
   * @default "main-content"
   */
  targetId?: string;

  /**
   * The text to display in the skip link
   * @default "Skip to main content"
   */
  label?: string;
}

/**
 * SkipLink component that appears on focus for keyboard navigation
 *
 * Usage:
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        padding: '1rem 1.5rem',
        backgroundColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        textDecoration: 'none',
        borderRadius: '0 0 0.375rem 0.375rem',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        transition: 'left 0.2s ease-in-out',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '1rem';
        e.currentTarget.style.top = '1rem';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
      }}
    >
      {label}
    </a>
  );
}

export default SkipLink;
