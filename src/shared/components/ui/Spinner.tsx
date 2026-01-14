/**
 * Spinner Component
 * Online MBA - Loading spinners and indicators
 */

import React, { memo } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface SpinnerProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'white' | 'current';
  /** Custom class name */
  className?: string;
  /** Accessible label */
  label?: string;
}

export interface FullPageSpinnerProps extends SpinnerProps {
  /** Optional message to display */
  message?: string;
}

// ============================================
// Styles
// ============================================

const sizeStyles = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-3',
};

const variantStyles = {
  primary: 'border-primary-500/30 border-t-primary-500',
  secondary: 'border-secondary-500/30 border-t-secondary-500',
  white: 'border-white/30 border-t-white',
  current: 'border-current/30 border-t-current',
};

// ============================================
// Spinner Component
// ============================================

export const Spinner = memo(function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading...',
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'rounded-full animate-spin',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
});

// ============================================
// Inline Spinner Component
// ============================================

export interface InlineSpinnerProps extends SpinnerProps {
  /** Text to show alongside spinner */
  text?: string;
}

export const InlineSpinner = memo(function InlineSpinner({
  text = 'Loading...',
  size = 'sm',
  variant = 'primary',
  className,
}: InlineSpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Spinner size={size} variant={variant} />
      {text && <span className="text-sm text-neutral-600 dark:text-neutral-400">{text}</span>}
    </span>
  );
});

// ============================================
// Full Page Spinner Component
// ============================================

export const FullPageSpinner = memo(function FullPageSpinner({
  message,
  size = 'lg',
  variant = 'primary',
  className,
}: FullPageSpinnerProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm',
        className
      )}
    >
      <Spinner size={size} variant={variant} />
      {message && (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          {message}
        </p>
      )}
    </div>
  );
});

// ============================================
// Button Spinner Component
// ============================================

export interface ButtonSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonSpinner = memo(function ButtonSpinner({
  size = 'sm',
  className,
}: ButtonSpinnerProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <svg
      className={cn('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

// ============================================
// Dots Spinner Component
// ============================================

export interface DotsSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'neutral';
  className?: string;
}

export const DotsSpinner = memo(function DotsSpinner({
  size = 'md',
  variant = 'primary',
  className,
}: DotsSpinnerProps) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const variants = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    neutral: 'bg-neutral-500',
  };

  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            sizes[size],
            variants[variant]
          )}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
});

// ============================================
// Pulse Spinner Component
// ============================================

export interface PulseSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'neutral';
  className?: string;
}

export const PulseSpinner = memo(function PulseSpinner({
  size = 'md',
  variant = 'primary',
  className,
}: PulseSpinnerProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const variants = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    neutral: 'bg-neutral-500',
  };

  return (
    <div className={cn('relative', sizes[size], className)} role="status" aria-label="Loading">
      <span
        className={cn(
          'absolute inset-0 rounded-full opacity-75 animate-ping',
          variants[variant]
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full h-full w-full',
          variants[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
});

export default Spinner;
