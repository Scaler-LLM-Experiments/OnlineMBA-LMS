/**
 * SafeHtml Component
 * Online MBA - XSS-safe HTML rendering with DOMPurify
 */

import React, { memo, useMemo } from 'react';
import { createSafeHtml, SanitizeLevel } from '../../../core/utils/sanitize';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface SafeHtmlProps {
  /** HTML content to sanitize and render */
  html: string;
  /** Sanitization level */
  level?: SanitizeLevel;
  /** HTML element to render as */
  as?: 'div' | 'span' | 'article' | 'section' | 'p' | 'main';
  /** Custom class name */
  className?: string;
}

// ============================================
// SafeHtml Component
// ============================================

/**
 * Safely renders HTML content with XSS protection using DOMPurify.
 * Use this component instead of dangerouslySetInnerHTML throughout the app.
 */
export const SafeHtml = memo(function SafeHtml({
  html,
  level = 'standard',
  as = 'div',
  className,
}: SafeHtmlProps) {
  // Memoize sanitization to avoid recalculating on every render
  const sanitizedHtml = useMemo(
    () => createSafeHtml(html, level),
    [html, level]
  );

  const proseClasses = level !== 'minimal' ? cn(
    'prose prose-neutral dark:prose-invert max-w-none',
    'prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100',
    'prose-p:text-neutral-700 dark:prose-p:text-neutral-300',
    'prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline',
    'prose-strong:text-neutral-900 dark:prose-strong:text-neutral-100',
    'prose-code:text-primary-600 dark:prose-code:text-primary-400',
    'prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-800',
    'prose-blockquote:border-primary-500',
    'prose-ul:list-disc prose-ol:list-decimal',
    'prose-li:text-neutral-700 dark:prose-li:text-neutral-300',
    'prose-hr:border-neutral-200 dark:prose-hr:border-neutral-700'
  ) : '';

  const props = {
    className: cn(proseClasses, className),
    dangerouslySetInnerHTML: sanitizedHtml,
  };

  switch (as) {
    case 'span':
      return <span {...props} />;
    case 'article':
      return <article {...props} />;
    case 'section':
      return <section {...props} />;
    case 'p':
      return <p {...props} />;
    case 'main':
      return <main {...props} />;
    default:
      return <div {...props} />;
  }
});

// ============================================
// Specialized SafeHtml Components
// ============================================

/**
 * Renders plain text content stripped of all HTML tags.
 * Use for user-generated content that should not contain any formatting.
 */
export const SafeText = memo(function SafeText({
  html,
  as = 'span',
  className,
}: Omit<SafeHtmlProps, 'level'>) {
  const sanitizedHtml = useMemo(
    () => createSafeHtml(html, 'minimal'),
    [html]
  );

  const props = {
    className,
    dangerouslySetInnerHTML: sanitizedHtml,
  };

  switch (as) {
    case 'div':
      return <div {...props} />;
    case 'p':
      return <p {...props} />;
    default:
      return <span {...props} />;
  }
});

/**
 * Renders rich HTML content with full formatting support.
 * Use for trusted content like announcements, course descriptions, etc.
 */
export const RichContent = memo(function RichContent({
  html,
  className,
}: Omit<SafeHtmlProps, 'level' | 'as'>) {
  const sanitizedHtml = useMemo(
    () => createSafeHtml(html, 'rich'),
    [html]
  );

  return (
    <article
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        'prose-headings:font-semibold',
        'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
        'prose-p:leading-relaxed',
        'prose-a:text-primary-600 dark:prose-a:text-primary-400',
        'prose-img:rounded-xl prose-img:shadow-lg',
        'prose-table:border-collapse prose-table:w-full',
        'prose-th:bg-neutral-100 dark:prose-th:bg-neutral-800',
        'prose-th:p-3 prose-td:p-3',
        'prose-th:border prose-td:border',
        'prose-th:border-neutral-200 dark:prose-th:border-neutral-700',
        'prose-td:border-neutral-200 dark:prose-td:border-neutral-700',
        className
      )}
      dangerouslySetInnerHTML={sanitizedHtml}
    />
  );
});

/**
 * Renders content with basic formatting (bold, italic, links, lists).
 * Use for moderately trusted content like course materials.
 */
export const BasicContent = memo(function BasicContent({
  html,
  className,
}: Omit<SafeHtmlProps, 'level' | 'as'>) {
  const sanitizedHtml = useMemo(
    () => createSafeHtml(html, 'basic'),
    [html]
  );

  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none prose-sm',
        className
      )}
      dangerouslySetInnerHTML={sanitizedHtml}
    />
  );
});

export default SafeHtml;
