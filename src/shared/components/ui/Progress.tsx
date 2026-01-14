/**
 * Progress Component
 * Online MBA - Progress bars and indicators
 */

import React, { memo } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface ProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label format */
  labelFormat?: 'percent' | 'value' | 'custom';
  /** Custom label */
  customLabel?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Show animation */
  animated?: boolean;
  /** Show stripes */
  striped?: boolean;
  /** Custom class name */
  className?: string;
}

export interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Show label */
  showLabel?: boolean;
  /** Custom class name */
  className?: string;
  /** Center content */
  children?: React.ReactNode;
}

// ============================================
// Styles
// ============================================

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const variantStyles = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

const circularVariantStyles = {
  primary: 'stroke-primary-500',
  secondary: 'stroke-secondary-500',
  success: 'stroke-success-500',
  warning: 'stroke-warning-500',
  error: 'stroke-error-500',
};

// ============================================
// Progress Bar Component
// ============================================

export const Progress = memo(function Progress({
  value,
  max = 100,
  showLabel = false,
  labelFormat = 'percent',
  customLabel,
  size = 'md',
  variant = 'primary',
  animated = false,
  striped = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getLabel = () => {
    if (customLabel) return customLabel;
    switch (labelFormat) {
      case 'value':
        return `${value}/${max}`;
      case 'percent':
      default:
        return `${Math.round(percentage)}%`;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {getLabel()}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantStyles[variant],
            animated && 'animate-pulse',
            striped &&
              'bg-stripes bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

// ============================================
// Circular Progress Component
// ============================================

export const CircularProgress = memo(function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  variant = 'primary',
  showLabel = true,
  className,
  children,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(circularVariantStyles[variant], 'transition-all duration-500 ease-out')}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
});

// ============================================
// Steps Progress Component
// ============================================

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface StepsProgressProps {
  /** Steps configuration */
  steps: Step[];
  /** Current step index (0-based) */
  currentStep: number;
  /** Step click handler */
  onStepClick?: (stepIndex: number) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom class name */
  className?: string;
}

export const StepsProgress = memo(function StepsProgress({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  className,
}: StepsProgressProps) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-start' : 'flex-col',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = onStepClick && index <= currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              'flex',
              orientation === 'horizontal' ? 'flex-col items-center flex-1' : 'flex-row items-start'
            )}
          >
            <div
              className={cn(
                'flex items-center',
                orientation === 'horizontal' ? 'w-full' : 'flex-col'
              )}
            >
              {/* Connector line (before) */}
              {index > 0 && (
                <div
                  className={cn(
                    'transition-colors duration-300',
                    orientation === 'horizontal' ? 'flex-1 h-0.5' : 'w-0.5 h-6',
                    isCompleted || isCurrent
                      ? 'bg-primary-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  )}
                />
              )}

              {/* Step indicator */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                  isCompleted && 'bg-primary-500 border-primary-500',
                  isCurrent && 'border-primary-500 bg-white dark:bg-neutral-900',
                  !isCompleted && !isCurrent && 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900',
                  isClickable && 'cursor-pointer hover:scale-110',
                  !isClickable && 'cursor-default'
                )}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span
                    className={cn(
                      'font-semibold',
                      isCurrent ? 'text-primary-500' : 'text-neutral-400'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </button>

              {/* Connector line (after) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'transition-colors duration-300',
                    orientation === 'horizontal' ? 'flex-1 h-0.5' : 'w-0.5 h-6',
                    isCompleted
                      ? 'bg-primary-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <div
              className={cn(
                'mt-2',
                orientation === 'horizontal' ? 'text-center' : 'ml-4'
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent || isCompleted
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500'
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default Progress;
