/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks by sanitizing user-generated HTML content
 */

import DOMPurify from 'dompurify';

// ============================================
// Configuration
// ============================================

// Allowed HTML tags for different contexts
const ALLOWED_TAGS = {
  /** Minimal - only basic formatting */
  minimal: ['b', 'i', 'u', 'strong', 'em', 'br'],

  /** Basic - common text formatting */
  basic: [
    'b', 'i', 'u', 's', 'strong', 'em', 'br', 'p', 'span',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  ],

  /** Standard - includes headers and links */
  standard: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'b', 'i', 'u', 's', 'strong', 'em', 'br', 'p', 'span', 'div',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'sup', 'sub',
  ],

  /** Rich - includes media and forms (for admin use) */
  rich: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'b', 'i', 'u', 's', 'strong', 'em', 'br', 'p', 'span', 'div',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'img', 'video', 'audio', 'source', 'iframe',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
    'hr', 'sup', 'sub', 'figure', 'figcaption',
    'details', 'summary', 'mark', 'del', 'ins',
  ],
};

// Allowed attributes for different contexts
const ALLOWED_ATTR = {
  minimal: [],
  basic: ['class', 'style'],
  standard: [
    'class', 'style', 'id',
    'href', 'target', 'rel',
    'src', 'alt', 'title', 'width', 'height',
    'colspan', 'rowspan', 'scope',
  ],
  rich: [
    'class', 'style', 'id', 'data-*',
    'href', 'target', 'rel', 'download',
    'src', 'alt', 'title', 'width', 'height', 'loading',
    'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload',
    'colspan', 'rowspan', 'scope',
    'frameborder', 'allow', 'allowfullscreen',
    'open', 'datetime',
  ],
};

// CSS properties allowed in style attributes
const ALLOWED_STYLES = [
  'color',
  'background-color',
  'background',
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'text-align',
  'text-decoration',
  'line-height',
  'letter-spacing',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-radius',
  'width',
  'max-width',
  'height',
  'max-height',
  'display',
  'vertical-align',
];

// Trusted domains for iframes and links
const TRUSTED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'loom.com',
  'www.loom.com',
  'docs.google.com',
  'drive.google.com',
  'zoom.us',
  'scaler.com',
  'www.scaler.com',
];

// ============================================
// Types
// ============================================

export type SanitizeLevel = 'minimal' | 'basic' | 'standard' | 'rich';

interface SanitizeOptions {
  /** Sanitization level */
  level?: SanitizeLevel;
  /** Additional allowed tags */
  extraTags?: string[];
  /** Additional allowed attributes */
  extraAttrs?: string[];
  /** Whether to allow external links */
  allowExternalLinks?: boolean;
  /** Whether to add noopener/noreferrer to links */
  secureLlinks?: boolean;
  /** Custom hook to run on each node */
  customHook?: (node: Element) => void;
}

// ============================================
// Sanitization Functions
// ============================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(
  dirty: string,
  options: SanitizeOptions = {}
): string {
  const {
    level = 'standard',
    extraTags = [],
    extraAttrs = [],
    allowExternalLinks = true,
    secureLlinks = true,
  } = options;

  // Configure DOMPurify
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: [...ALLOWED_TAGS[level], ...extraTags],
    ALLOWED_ATTR: [...ALLOWED_ATTR[level], ...extraAttrs],
    ALLOW_DATA_ATTR: level === 'rich',
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };

  // Add hooks for additional security
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Handle links
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');

      // Remove javascript: links
      if (href?.startsWith('javascript:')) {
        node.removeAttribute('href');
      }

      // Add security attributes to external links
      if (secureLlinks && href && isExternalLink(href)) {
        if (!allowExternalLinks) {
          node.removeAttribute('href');
        } else {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }

    // Handle iframes
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src');

      // Only allow trusted domains
      if (src && !isTrustedDomain(src)) {
        node.parentNode?.removeChild(node);
      } else {
        // Add sandbox attribute for security
        node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      }
    }

    // Handle images
    if (node.tagName === 'IMG') {
      // Add loading="lazy" for performance
      node.setAttribute('loading', 'lazy');

      // Ensure alt attribute exists
      if (!node.hasAttribute('alt')) {
        node.setAttribute('alt', '');
      }
    }

    // Sanitize style attributes
    if (node.hasAttribute('style')) {
      const style = node.getAttribute('style');
      const sanitizedStyle = sanitizeStyles(style || '');
      if (sanitizedStyle) {
        node.setAttribute('style', sanitizedStyle);
      } else {
        node.removeAttribute('style');
      }
    }
  });

  // Run sanitization
  const clean = DOMPurify.sanitize(dirty, config);

  // Remove hooks after use to prevent memory leaks
  DOMPurify.removeAllHooks();

  return clean;
}

/**
 * Sanitize text only (strip all HTML)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  // Allow common safe protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', '/'];
  const hasProtocol = safeProtocols.some((p) => trimmed.startsWith(p));

  // If no protocol, assume relative URL (safe)
  if (!hasProtocol && !trimmed.includes(':')) {
    return url;
  }

  // If has safe protocol, return as-is
  if (hasProtocol) {
    return url;
  }

  // Block unknown protocols
  return '';
}

/**
 * Sanitize CSS styles
 */
export function sanitizeStyles(styles: string): string {
  const properties = styles.split(';');
  const sanitized: string[] = [];

  for (const prop of properties) {
    const [name, value] = prop.split(':').map((s) => s.trim());

    if (!name || !value) continue;

    // Check if property is allowed
    const normalizedName = name.toLowerCase();
    if (ALLOWED_STYLES.includes(normalizedName)) {
      // Check for url() values (potential XSS)
      if (value.toLowerCase().includes('url(')) {
        continue;
      }

      // Check for expression() (IE-specific XSS)
      if (value.toLowerCase().includes('expression(')) {
        continue;
      }

      // Check for javascript: in values
      if (value.toLowerCase().includes('javascript:')) {
        continue;
      }

      sanitized.push(`${name}: ${value}`);
    }
  }

  return sanitized.join('; ');
}

/**
 * Escape HTML entities (for displaying raw HTML as text)
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(html: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
  };

  return html.replace(/&(amp|lt|gt|quot|#039|#x27|#x2F);/g, (entity) => map[entity] || entity);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if URL is external
 */
function isExternalLink(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Check if URL is from a trusted domain
 */
function isTrustedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return TRUSTED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Truncate HTML content safely (preserves tags)
 */
export function truncateHtml(
  html: string,
  maxLength: number,
  ellipsis = '...'
): string {
  const sanitized = sanitizeHtml(html);
  const text = stripHtml(sanitized);

  if (text.length <= maxLength) {
    return sanitized;
  }

  // Find a safe truncation point
  let truncateAt = maxLength;
  const lastSpace = text.lastIndexOf(' ', maxLength);
  if (lastSpace > maxLength * 0.8) {
    truncateAt = lastSpace;
  }

  // Truncate and add ellipsis
  const truncatedText = text.substring(0, truncateAt) + ellipsis;

  return escapeHtml(truncatedText);
}

// ============================================
// React-specific utilities
// ============================================

/**
 * Create safe props for dangerouslySetInnerHTML
 */
export function createSafeHtml(
  html: string,
  level: SanitizeLevel = 'standard'
): { __html: string } {
  return {
    __html: sanitizeHtml(html, { level }),
  };
}

/**
 * Safe wrapper component props
 */
export interface SafeHtmlProps {
  html: string;
  level?: SanitizeLevel;
  className?: string;
  as?: 'div' | 'span' | 'article' | 'section' | 'p' | 'main';
}

export default sanitizeHtml;
