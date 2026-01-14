/**
 * Input Component
 * Scaler Design System - Form input elements
 */

import React, {
  forwardRef,
  memo,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  useState,
  useId,
} from 'react';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export type InputSize = 'sm' | 'md' | 'lg';
export type InputStatus = 'default' | 'error' | 'success';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: InputSize;
  /** Status for validation feedback */
  status?: InputStatus;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (overrides helperText when status is error) */
  errorMessage?: string;
  /** Icon on the left side */
  leftIcon?: ReactNode;
  /** Icon on the right side */
  rightIcon?: ReactNode;
  /** Full width input */
  fullWidth?: boolean;
  /** Show clear button */
  clearable?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Size variant */
  size?: InputSize;
  /** Status for validation feedback */
  status?: InputStatus;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Full width textarea */
  fullWidth?: boolean;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

// ============================================
// Styles
// ============================================

const baseInputStyles = [
  'w-full',
  'bg-white dark:bg-neutral-900',
  'text-neutral-900 dark:text-neutral-100',
  'placeholder-neutral-400 dark:placeholder-neutral-500',
  'border border-neutral-200 dark:border-neutral-700',
  'rounded-xl',
  'transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-offset-0',
  'disabled:bg-neutral-100 dark:disabled:bg-neutral-800',
  'disabled:text-neutral-500 dark:disabled:text-neutral-400',
  'disabled:cursor-not-allowed',
];

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-5 text-lg',
};

const textareaSizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm min-h-[80px]',
  md: 'px-4 py-3 text-base min-h-[120px]',
  lg: 'px-5 py-4 text-lg min-h-[160px]',
};

const statusStyles: Record<InputStatus, { input: string; ring: string }> = {
  default: {
    input: 'border-neutral-200 dark:border-neutral-700',
    ring: 'focus:ring-primary-500/20 focus:border-primary-500',
  },
  error: {
    input: 'border-error-500 dark:border-error-500',
    ring: 'focus:ring-error-500/20 focus:border-error-500',
  },
  success: {
    input: 'border-success-500 dark:border-success-500',
    ring: 'focus:ring-success-500/20 focus:border-success-500',
  },
};

// ============================================
// Input Component
// ============================================

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    (
      {
        className,
        type = 'text',
        size = 'md',
        status = 'default',
        label,
        helperText,
        errorMessage,
        leftIcon,
        rightIcon,
        fullWidth = true,
        clearable = false,
        onClear,
        disabled,
        id: providedId,
        value,
        ...props
      },
      ref
    ) => {
      const generatedId = useId();
      const inputId = providedId || generatedId;
      const helperId = `${inputId}-helper`;
      const [showPassword, setShowPassword] = useState(false);

      const isPassword = type === 'password';
      const hasValue = value !== undefined && value !== '';
      const showClear = clearable && hasValue && !disabled;
      const displayStatus = errorMessage ? 'error' : status;
      const displayHelper = errorMessage || helperText;

      // Calculate padding for icons
      const leftPadding = leftIcon ? 'pl-11' : '';
      const rightPadding = rightIcon || isPassword || showClear ? 'pr-11' : '';

      return (
        <div className={cn('space-y-1.5', fullWidth ? 'w-full' : 'w-auto')}>
          {/* Label */}
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {label}
              {props.required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}

          {/* Input Wrapper */}
          <div className="relative">
            {/* Left Icon */}
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
                {leftIcon}
              </div>
            )}

            {/* Input */}
            <input
              ref={ref}
              id={inputId}
              type={isPassword && showPassword ? 'text' : type}
              className={cn(
                baseInputStyles,
                sizeStyles[size],
                statusStyles[displayStatus].input,
                statusStyles[displayStatus].ring,
                leftPadding,
                rightPadding,
                className
              )}
              disabled={disabled}
              aria-invalid={displayStatus === 'error'}
              aria-describedby={displayHelper ? helperId : undefined}
              value={value}
              {...props}
            />

            {/* Right Icons Container */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Clear Button */}
              {showClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Password Toggle */}
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Status Icon */}
              {displayStatus === 'error' && (
                <AlertCircle className="w-4 h-4 text-error-500" />
              )}
              {displayStatus === 'success' && (
                <CheckCircle className="w-4 h-4 text-success-500" />
              )}

              {/* Custom Right Icon */}
              {rightIcon && !isPassword && displayStatus === 'default' && (
                <div className="text-neutral-400 dark:text-neutral-500 pointer-events-none">
                  {rightIcon}
                </div>
              )}
            </div>
          </div>

          {/* Helper Text */}
          {displayHelper && (
            <p
              id={helperId}
              className={cn(
                'text-sm',
                displayStatus === 'error'
                  ? 'text-error-500'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {displayHelper}
            </p>
          )}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';

// ============================================
// Search Input Component
// ============================================

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  /** Callback when search is submitted */
  onSearch?: (value: string) => void;
}

export const SearchInput = memo(
  forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, placeholder = 'Search...', onSearch, onKeyDown, ...props }, ref) => {
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
          onSearch((e.target as HTMLInputElement).value);
        }
        onKeyDown?.(e);
      };

      return (
        <Input
          ref={ref}
          type="search"
          placeholder={placeholder}
          leftIcon={<Search className="w-4 h-4" />}
          clearable
          onKeyDown={handleKeyDown}
          className={cn('', className)}
          {...props}
        />
      );
    }
  )
);

SearchInput.displayName = 'SearchInput';

// ============================================
// Textarea Component
// ============================================

export const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
      {
        className,
        size = 'md',
        status = 'default',
        label,
        helperText,
        errorMessage,
        fullWidth = true,
        autoResize = false,
        disabled,
        id: providedId,
        ...props
      },
      ref
    ) => {
      const generatedId = useId();
      const textareaId = providedId || generatedId;
      const helperId = `${textareaId}-helper`;

      const displayStatus = errorMessage ? 'error' : status;
      const displayHelper = errorMessage || helperText;

      const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
        }
      };

      return (
        <div className={cn('space-y-1.5', fullWidth ? 'w-full' : 'w-auto')}>
          {/* Label */}
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {label}
              {props.required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={ref}
              id={textareaId}
              className={cn(
                baseInputStyles,
                textareaSizeStyles[size],
                statusStyles[displayStatus].input,
                statusStyles[displayStatus].ring,
                autoResize && 'resize-none overflow-hidden',
                className
              )}
              disabled={disabled}
              aria-invalid={displayStatus === 'error'}
              aria-describedby={displayHelper ? helperId : undefined}
              onInput={handleInput}
              {...props}
            />

            {/* Status Icon */}
            {displayStatus !== 'default' && (
              <div className="absolute right-3 top-3">
                {displayStatus === 'error' && (
                  <AlertCircle className="w-4 h-4 text-error-500" />
                )}
                {displayStatus === 'success' && (
                  <CheckCircle className="w-4 h-4 text-success-500" />
                )}
              </div>
            )}
          </div>

          {/* Helper Text */}
          {displayHelper && (
            <p
              id={helperId}
              className={cn(
                'text-sm',
                displayStatus === 'error'
                  ? 'text-error-500'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {displayHelper}
            </p>
          )}
        </div>
      );
    }
  )
);

Textarea.displayName = 'Textarea';

export default Input;
