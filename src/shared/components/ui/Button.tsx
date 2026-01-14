/**
 * Button Component
 * Scaler Design System - Primary interactive element
 */

import React, { forwardRef, memo, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'link' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Shows loading spinner */
  isLoading?: boolean;
  /** Loading text to show */
  loadingText?: string;
  /** Icon to show before text */
  leftIcon?: ReactNode;
  /** Icon to show after text */
  rightIcon?: ReactNode;
  /** Makes button full width */
  fullWidth?: boolean;
  /** Children content */
  children?: ReactNode;
}

// ============================================
// Styles
// ============================================

const baseStyles = [
  'inline-flex items-center justify-center gap-2',
  'font-medium',
  'rounded-xl',
  'transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
];

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-primary-600 to-primary-500',
    'text-white',
    'shadow-glow-primary/50',
    'hover:shadow-glow-primary hover:-translate-y-0.5',
    'active:translate-y-0 active:shadow-md',
    'focus-visible:ring-primary-500',
  ].join(' '),

  secondary: [
    'bg-neutral-100 dark:bg-neutral-800',
    'text-neutral-900 dark:text-neutral-100',
    'border border-neutral-200 dark:border-neutral-700',
    'hover:bg-neutral-200 dark:hover:bg-neutral-700',
    'hover:border-neutral-300 dark:hover:border-neutral-600',
    'focus-visible:ring-neutral-500',
  ].join(' '),

  ghost: [
    'text-neutral-600 dark:text-neutral-400',
    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
    'hover:text-neutral-900 dark:hover:text-neutral-100',
    'focus-visible:ring-neutral-500',
  ].join(' '),

  outline: [
    'border-2 border-primary-500',
    'text-primary-600 dark:text-primary-400',
    'hover:bg-primary-50 dark:hover:bg-primary-950',
    'focus-visible:ring-primary-500',
  ].join(' '),

  link: [
    'text-secondary-500 hover:text-secondary-600',
    'underline-offset-4 hover:underline',
    'p-0 h-auto',
  ].join(' '),

  destructive: [
    'bg-error-500 hover:bg-error-600',
    'text-white',
    'shadow-md hover:shadow-lg',
    'focus-visible:ring-error-500',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-14 px-8 text-lg',
  icon: 'h-10 w-10 p-0',
};

// ============================================
// Component
// ============================================

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        className,
        variant = 'primary',
        size = 'md',
        isLoading = false,
        loadingText,
        leftIcon,
        rightIcon,
        fullWidth = false,
        disabled,
        children,
        ...props
      },
      ref
    ) => {
      const isDisabled = disabled || isLoading;

      return (
        <button
          ref={ref}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            fullWidth && 'w-full',
            className
          )}
          disabled={isDisabled}
          aria-busy={isLoading}
          {...props}
        >
          {/* Loading Spinner */}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}

          {/* Left Icon */}
          {!isLoading && leftIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          {/* Content */}
          {isLoading && loadingText ? (
            <span>{loadingText}</span>
          ) : size !== 'icon' ? (
            <span>{children}</span>
          ) : (
            children
          )}

          {/* Right Icon */}
          {!isLoading && rightIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

// ============================================
// Icon Button Variant
// ============================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'size'> {
  /** Accessible label for the button */
  'aria-label': string;
  /** Size of the icon button */
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, size = 'md', ...props }, ref) => {
      const iconSizeStyles: Record<string, string> = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      };

      return (
        <Button
          ref={ref}
          size="icon"
          className={cn(iconSizeStyles[size], className)}
          {...props}
        />
      );
    }
  )
);

IconButton.displayName = 'IconButton';

// ============================================
// Button Group
// ============================================

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  /** Attach buttons together */
  attached?: boolean;
}

export const ButtonGroup = memo(
  ({ children, className, attached = false }: ButtonGroupProps) => {
    return (
      <div
        className={cn(
          'inline-flex',
          attached ? 'divide-x divide-neutral-200 dark:divide-neutral-700' : 'gap-2',
          className
        )}
        role="group"
      >
        {attached
          ? React.Children.map(children, (child, index) => {
              if (!React.isValidElement(child)) return child;

              const isFirst = index === 0;
              const isLast = index === React.Children.count(children) - 1;

              return React.cloneElement(child as React.ReactElement<ButtonProps>, {
                className: cn(
                  (child as React.ReactElement<ButtonProps>).props.className,
                  !isFirst && 'rounded-l-none',
                  !isLast && 'rounded-r-none'
                ),
              });
            })
          : children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export default Button;
