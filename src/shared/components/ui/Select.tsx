/**
 * Select Component
 * Online MBA - Dropdown select implementation
 */

import React, {
  memo,
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  ReactNode,
} from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useOnClickOutside } from '../../../core/hooks/useSafeEffect';

// ============================================
// Types
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

export interface SelectProps {
  /** Select options */
  options: SelectOption[];
  /** Current value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Whether to show search input */
  searchable?: boolean;
  /** Whether to allow clearing */
  clearable?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom ID */
  id?: string;
}

export interface MultiSelectProps extends Omit<SelectProps, 'value' | 'onChange'> {
  /** Current values */
  value?: string[];
  /** Callback when values change */
  onChange?: (values: string[]) => void;
  /** Maximum number of selections */
  max?: number;
}

// ============================================
// Styles
// ============================================

const sizeStyles = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-5 text-lg',
};

// ============================================
// Select Component
// ============================================

export const Select = memo(
  forwardRef<HTMLButtonElement, SelectProps>(
    (
      {
        options,
        value,
        onChange,
        placeholder = 'Select an option',
        label,
        helperText,
        errorMessage,
        disabled = false,
        required = false,
        searchable = false,
        clearable = false,
        size = 'md',
        fullWidth = true,
        className,
        id: providedId,
      },
      ref
    ) => {
      const generatedId = useId();
      const selectId = providedId || generatedId;
      const [isOpen, setIsOpen] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const containerRef = useRef<HTMLDivElement>(null);
      const searchInputRef = useRef<HTMLInputElement>(null);

      const hasError = Boolean(errorMessage);
      const selectedOption = options.find((opt) => opt.value === value);

      // Close dropdown when clicking outside
      useOnClickOutside(containerRef as React.RefObject<HTMLElement>, () => setIsOpen(false));

      // Filter options based on search
      const filteredOptions = searchable
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

      // Handle option select
      const handleSelect = useCallback(
        (optionValue: string) => {
          onChange?.(optionValue);
          setIsOpen(false);
          setSearchQuery('');
        },
        [onChange]
      );

      // Handle clear
      const handleClear = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          onChange?.('');
        },
        [onChange]
      );

      // Focus search input when opening
      useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, [isOpen, searchable]);

      // Handle keyboard navigation
      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        },
        []
      );

      return (
        <div
          ref={containerRef}
          className={cn('relative', fullWidth ? 'w-full' : 'w-auto')}
        >
          {/* Label */}
          {label && (
            <label
              htmlFor={selectId}
              className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {label}
              {required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}

          {/* Select Button */}
          <button
            ref={ref}
            id={selectId}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'relative w-full flex items-center justify-between gap-2',
              'bg-white dark:bg-neutral-900',
              'border rounded-xl',
              'text-left',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              sizeStyles[size],
              hasError
                ? 'border-error-500 focus:ring-error-500/20'
                : 'border-neutral-200 dark:border-neutral-700 focus:ring-primary-500/20 focus:border-primary-500',
              disabled && 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800',
              className
            )}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span
              className={cn(
                'flex-1 truncate',
                !selectedOption && 'text-neutral-500'
              )}
            >
              {selectedOption?.label || placeholder}
            </span>

            <div className="flex items-center gap-1">
              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-neutral-400 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              className={cn(
                'absolute z-50 w-full mt-1',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-800',
                'rounded-xl shadow-xl',
                'overflow-hidden',
                'animate-scale-in'
              )}
            >
              {/* Search Input */}
              {searchable && (
                <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className={cn(
                        'w-full pl-9 pr-3 py-2',
                        'bg-neutral-100 dark:bg-neutral-800',
                        'text-neutral-900 dark:text-neutral-100',
                        'placeholder-neutral-500',
                        'rounded-lg border-none',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <ul
                role="listbox"
                className="max-h-60 overflow-y-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-neutral-500 text-center">
                    No options found
                  </li>
                ) : (
                  filteredOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        disabled={option.disabled}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                          'transition-colors duration-150',
                          option.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          option.value === value && 'bg-primary-50 dark:bg-primary-950/30'
                        )}
                        role="option"
                        aria-selected={option.value === value}
                      >
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              'block text-sm font-medium truncate',
                              option.value === value
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-neutral-900 dark:text-neutral-100'
                            )}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="block text-xs text-neutral-500 truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                        {option.value === value && (
                          <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Helper/Error Text */}
          {(helperText || errorMessage) && (
            <p
              className={cn(
                'mt-1.5 text-sm',
                hasError ? 'text-error-500' : 'text-neutral-500'
              )}
            >
              {errorMessage || helperText}
            </p>
          )}
        </div>
      );
    }
  )
);

Select.displayName = 'Select';

// ============================================
// Multi Select Component
// ============================================

export const MultiSelect = memo(
  forwardRef<HTMLButtonElement, MultiSelectProps>(
    (
      {
        options,
        value = [],
        onChange,
        placeholder = 'Select options',
        label,
        helperText,
        errorMessage,
        disabled = false,
        required = false,
        searchable = false,
        max,
        size = 'md',
        fullWidth = true,
        className,
        id: providedId,
      },
      ref
    ) => {
      const generatedId = useId();
      const selectId = providedId || generatedId;
      const [isOpen, setIsOpen] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const containerRef = useRef<HTMLDivElement>(null);

      const hasError = Boolean(errorMessage);
      const selectedOptions = options.filter((opt) => value.includes(opt.value));
      const canSelectMore = !max || value.length < max;

      useOnClickOutside(containerRef as React.RefObject<HTMLElement>, () => setIsOpen(false));

      const filteredOptions = searchable
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

      const handleToggle = useCallback(
        (optionValue: string) => {
          const isSelected = value.includes(optionValue);
          if (isSelected) {
            onChange?.(value.filter((v) => v !== optionValue));
          } else if (canSelectMore) {
            onChange?.([...value, optionValue]);
          }
        },
        [value, onChange, canSelectMore]
      );

      const handleRemove = useCallback(
        (optionValue: string, e: React.MouseEvent) => {
          e.stopPropagation();
          onChange?.(value.filter((v) => v !== optionValue));
        },
        [value, onChange]
      );

      return (
        <div
          ref={containerRef}
          className={cn('relative', fullWidth ? 'w-full' : 'w-auto')}
        >
          {label && (
            <label
              htmlFor={selectId}
              className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {label}
              {required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}

          <button
            ref={ref}
            id={selectId}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'relative w-full min-h-[44px] flex items-center gap-2 flex-wrap',
              'bg-white dark:bg-neutral-900',
              'border rounded-xl',
              'px-3 py-2',
              'text-left',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              hasError
                ? 'border-error-500 focus:ring-error-500/20'
                : 'border-neutral-200 dark:border-neutral-700 focus:ring-primary-500/20 focus:border-primary-500',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
          >
            {selectedOptions.length === 0 ? (
              <span className="text-neutral-500">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1',
                    'bg-primary-100 dark:bg-primary-900/30',
                    'text-primary-700 dark:text-primary-300',
                    'text-sm font-medium rounded-lg'
                  )}
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(opt.value, e)}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}

            <ChevronDown
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'w-4 h-4 text-neutral-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {isOpen && (
            <div
              className={cn(
                'absolute z-50 w-full mt-1',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-800',
                'rounded-xl shadow-xl',
                'overflow-hidden',
                'animate-scale-in'
              )}
            >
              {searchable && (
                <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className={cn(
                        'w-full pl-9 pr-3 py-2',
                        'bg-neutral-100 dark:bg-neutral-800',
                        'rounded-lg border-none',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                      )}
                    />
                  </div>
                </div>
              )}

              <ul className="max-h-60 overflow-y-auto py-1">
                {filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isDisabled = option.disabled || (!isSelected && !canSelectMore);

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        disabled={isDisabled}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                          'transition-colors duration-150',
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center',
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-neutral-300 dark:border-neutral-600'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="flex-1 text-sm">{option.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(helperText || errorMessage) && (
            <p
              className={cn(
                'mt-1.5 text-sm',
                hasError ? 'text-error-500' : 'text-neutral-500'
              )}
            >
              {errorMessage || helperText}
            </p>
          )}
        </div>
      );
    }
  )
);

MultiSelect.displayName = 'MultiSelect';

export default Select;
