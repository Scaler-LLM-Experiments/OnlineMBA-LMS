/**
 * Badge Component
 * Online MBA - Status badges and labels
 */

import React, { memo, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface BadgeProps {
  /** Badge content */
  children: ReactNode;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show as outline only */
  outline?: boolean;
  /** Show as dot indicator */
  dot?: boolean;
  /** Removable badge */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Custom class name */
  className?: string;
}

// ============================================
// Styles
// ============================================

const variantStyles = {
  default: {
    solid: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    outline: 'border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
    dot: 'bg-neutral-500',
  },
  primary: {
    solid: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    outline: 'border-primary-500 text-primary-600 dark:text-primary-400',
    dot: 'bg-primary-500',
  },
  secondary: {
    solid: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
    outline: 'border-secondary-500 text-secondary-600 dark:text-secondary-400',
    dot: 'bg-secondary-500',
  },
  success: {
    solid: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
    outline: 'border-success-500 text-success-600 dark:text-success-400',
    dot: 'bg-success-500',
  },
  warning: {
    solid: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
    outline: 'border-warning-500 text-warning-600 dark:text-warning-400',
    dot: 'bg-warning-500',
  },
  error: {
    solid: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
    outline: 'border-error-500 text-error-600 dark:text-error-400',
    dot: 'bg-error-500',
  },
  info: {
    solid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    outline: 'border-blue-500 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-sm',
  lg: 'px-2.5 py-1 text-base',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

// ============================================
// Badge Component
// ============================================

export const Badge = memo(function Badge({
  children,
  variant = 'default',
  size = 'md',
  outline = false,
  dot = false,
  removable = false,
  onRemove,
  className,
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        sizeStyles[size],
        outline ? `border ${styles.outline} bg-transparent` : styles.solid,
        className
      )}
    >
      {dot && (
        <span
          className={cn('rounded-full flex-shrink-0', dotSizes[size], styles.dot)}
        />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
});

// ============================================
// Status Badge Component
// ============================================

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'draft';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  StatusBadgeProps['status'],
  { variant: BadgeVariant; label: string }
> = {
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
  pending: { variant: 'warning', label: 'Pending' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  draft: { variant: 'default', label: 'Draft' },
};

export const StatusBadge = memo(function StatusBadge({
  status,
  label,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {label || config.label}
    </Badge>
  );
});

// ============================================
// Count Badge Component
// ============================================

export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CountBadge = memo(function CountBadge({
  count,
  max = 99,
  variant = 'primary',
  size = 'sm',
  className,
}: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge variant={variant} size={size} className={cn('min-w-[1.25rem] justify-center', className)}>
      {displayCount}
    </Badge>
  );
});

export default Badge;
