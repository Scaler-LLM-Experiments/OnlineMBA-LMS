/**
 * Card Component
 * Scaler Design System - Container component with glass morphism
 */

import React, { forwardRef, memo, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export type CardVariant = 'default' | 'glass' | 'elevated' | 'outline' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Whether the card is interactive/clickable */
  interactive?: boolean;
  /** Whether to show hover effects */
  hoverable?: boolean;
  /** Whether the card is in a loading state */
  isLoading?: boolean;
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Header title */
  title?: ReactNode;
  /** Header subtitle/description */
  subtitle?: ReactNode;
  /** Right-side action element */
  action?: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Align footer content */
  align?: 'left' | 'center' | 'right' | 'between';
}

// ============================================
// Styles
// ============================================

const baseStyles = [
  'relative',
  'rounded-2xl',
  'transition-all duration-300',
];

const variantStyles: Record<CardVariant, string> = {
  default: [
    'bg-white dark:bg-neutral-900',
    'border border-neutral-200 dark:border-neutral-800',
    'shadow-card',
  ].join(' '),

  glass: [
    'bg-white/80 dark:bg-neutral-900/50',
    'backdrop-blur-xl',
    'border border-neutral-200/50 dark:border-neutral-700/50',
    'shadow-glass dark:shadow-glass-dark',
  ].join(' '),

  elevated: [
    'bg-white dark:bg-neutral-900',
    'border border-neutral-100 dark:border-neutral-800',
    'shadow-xl dark:shadow-2xl',
  ].join(' '),

  outline: [
    'bg-transparent',
    'border-2 border-neutral-200 dark:border-neutral-700',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'border-none',
  ].join(' '),
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const interactiveStyles = [
  'cursor-pointer',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
];

const hoverableStyles = [
  'hover:shadow-card-hover',
  'hover:-translate-y-1',
  'hover:border-neutral-300 dark:hover:border-neutral-600',
];

// ============================================
// Card Component
// ============================================

export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(
    (
      {
        className,
        variant = 'default',
        padding = 'md',
        interactive = false,
        hoverable = false,
        isLoading = false,
        children,
        ...props
      },
      ref
    ) => {
      return (
        <div
          ref={ref}
          className={cn(
            baseStyles,
            variantStyles[variant],
            paddingStyles[padding],
            interactive && interactiveStyles,
            hoverable && hoverableStyles,
            isLoading && 'animate-pulse',
            className
          )}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'button' : undefined}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

Card.displayName = 'Card';

// ============================================
// Card Header Component
// ============================================

export const CardHeader = memo(
  forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, title, subtitle, action, children, ...props }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-start justify-between gap-4',
            'pb-4 border-b border-neutral-200 dark:border-neutral-800',
            'mb-4',
            className
          )}
          {...props}
        >
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
            {children}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      );
    }
  )
);

CardHeader.displayName = 'CardHeader';

// ============================================
// Card Content Component
// ============================================

export const CardContent = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
      return (
        <div
          ref={ref}
          className={cn('', className)}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

CardContent.displayName = 'CardContent';

// ============================================
// Card Footer Component
// ============================================

export const CardFooter = memo(
  forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, align = 'right', children, ...props }, ref) => {
      const alignStyles: Record<string, string> = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
      };

      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-3',
            'pt-4 border-t border-neutral-200 dark:border-neutral-800',
            'mt-4',
            alignStyles[align],
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

CardFooter.displayName = 'CardFooter';

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Stat label */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Change indicator (e.g., "+12%") */
  change?: string;
  /** Whether change is positive */
  changePositive?: boolean;
  /** Icon to display */
  icon?: ReactNode;
  /** Color theme */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const StatCard = memo(
  forwardRef<HTMLDivElement, StatCardProps>(
    (
      {
        className,
        label,
        value,
        change,
        changePositive,
        icon,
        color = 'primary',
        ...props
      },
      ref
    ) => {
      const colorStyles: Record<string, { bg: string; icon: string }> = {
        primary: {
          bg: 'bg-primary-50 dark:bg-primary-950/30',
          icon: 'text-primary-500',
        },
        secondary: {
          bg: 'bg-secondary-50 dark:bg-secondary-950/30',
          icon: 'text-secondary-500',
        },
        success: {
          bg: 'bg-success-50 dark:bg-success-950/30',
          icon: 'text-success-500',
        },
        warning: {
          bg: 'bg-warning-50 dark:bg-warning-950/30',
          icon: 'text-warning-500',
        },
        error: {
          bg: 'bg-error-50 dark:bg-error-950/30',
          icon: 'text-error-500',
        },
      };

      return (
        <Card ref={ref} className={cn('', className)} {...props}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {label}
              </p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {value}
              </p>
              {change && (
                <p
                  className={cn(
                    'text-sm font-medium',
                    changePositive
                      ? 'text-success-500'
                      : changePositive === false
                      ? 'text-error-500'
                      : 'text-neutral-500'
                  )}
                >
                  {change}
                </p>
              )}
            </div>
            {icon && (
              <div
                className={cn(
                  'p-3 rounded-xl',
                  colorStyles[color].bg
                )}
              >
                <div className={colorStyles[color].icon}>{icon}</div>
              </div>
            )}
          </div>
        </Card>
      );
    }
  )
);

StatCard.displayName = 'StatCard';

// ============================================
// Feature Card Component
// ============================================

interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon to display */
  icon: ReactNode;
  /** Action button */
  action?: ReactNode;
  /** Color theme */
  color?: 'primary' | 'secondary' | 'success';
}

export const FeatureCard = memo(
  forwardRef<HTMLDivElement, FeatureCardProps>(
    (
      {
        className,
        title,
        description,
        icon,
        action,
        color = 'primary',
        ...props
      },
      ref
    ) => {
      const colorStyles: Record<string, string> = {
        primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
        secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
        success: 'bg-gradient-to-br from-success-500 to-success-600',
      };

      return (
        <Card
          ref={ref}
          variant="elevated"
          hoverable
          className={cn('group overflow-hidden', className)}
          {...props}
        >
          {/* Icon Container */}
          <div
            className={cn(
              'w-14 h-14 rounded-xl mb-4',
              'flex items-center justify-center',
              'text-white',
              'group-hover:scale-110 transition-transform duration-300',
              colorStyles[color]
            )}
          >
            {icon}
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
            {description}
          </p>

          {/* Action */}
          {action && <div className="mt-auto">{action}</div>}
        </Card>
      );
    }
  )
);

FeatureCard.displayName = 'FeatureCard';

export default Card;
