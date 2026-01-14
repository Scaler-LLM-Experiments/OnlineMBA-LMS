/**
 * Tooltip Component
 * Online MBA - Tooltips and popovers
 */

import React, {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Trigger element */
  children: ReactNode;
  /** Placement */
  placement?: TooltipPlacement;
  /** Delay before showing (ms) */
  delay?: number;
  /** Trigger mode */
  trigger?: 'hover' | 'click' | 'focus';
  /** Disable tooltip */
  disabled?: boolean;
  /** Custom class name for tooltip */
  className?: string;
  /** Arrow visibility */
  arrow?: boolean;
  /** Max width */
  maxWidth?: number;
}

// ============================================
// Constants
// ============================================

const OFFSET = 8;

// ============================================
// Position calculation
// ============================================

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement
): { top: number; left: number } {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top = 0;
  let left = 0;

  // Base positions
  const positions = {
    top: {
      top: triggerRect.top + scrollY - tooltipRect.height - OFFSET,
      left: triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    bottom: {
      top: triggerRect.bottom + scrollY + OFFSET,
      left: triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    left: {
      top: triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.left + scrollX - tooltipRect.width - OFFSET,
    },
    right: {
      top: triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.right + scrollX + OFFSET,
    },
  };

  // Get base position
  const basePlacement = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
  const position = positions[basePlacement];
  top = position.top;
  left = position.left;

  // Adjust for alignment
  if (placement.endsWith('-start')) {
    if (basePlacement === 'top' || basePlacement === 'bottom') {
      left = triggerRect.left + scrollX;
    } else {
      top = triggerRect.top + scrollY;
    }
  } else if (placement.endsWith('-end')) {
    if (basePlacement === 'top' || basePlacement === 'bottom') {
      left = triggerRect.right + scrollX - tooltipRect.width;
    } else {
      top = triggerRect.bottom + scrollY - tooltipRect.height;
    }
  }

  // Keep within viewport
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding + scrollX));
  top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding + scrollY));

  return { top, left };
}

// ============================================
// Tooltip Component
// ============================================

export const Tooltip = memo(function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
  trigger = 'hover',
  disabled = false,
  className,
  arrow = true,
  maxWidth = 250,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  }, [disabled, delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const toggle = useCallback(() => {
    if (disabled) return;
    setIsVisible((prev) => !prev);
  }, [disabled]);

  // Update position when visible
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      setPosition(calculatePosition(triggerRect, tooltipRect, placement));
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, placement]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Click outside handler for click trigger
  useEffect(() => {
    if (trigger !== 'click' || !isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [trigger, isVisible]);

  const triggerProps = {
    ...(trigger === 'hover' && {
      onMouseEnter: show,
      onMouseLeave: hide,
    }),
    ...(trigger === 'click' && {
      onClick: toggle,
    }),
    ...(trigger === 'focus' && {
      onFocus: show,
      onBlur: hide,
    }),
  };

  const arrowPlacement = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
  const arrowStyles = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <>
      <div ref={triggerRef} className="inline-block" {...triggerProps}>
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              'fixed z-[9999] px-3 py-2',
              'bg-neutral-900 dark:bg-neutral-100',
              'text-white dark:text-neutral-900',
              'text-sm rounded-lg shadow-xl',
              'animate-fade-in',
              className
            )}
            style={{
              top: position.top,
              left: position.left,
              maxWidth,
            }}
          >
            {content}
            {arrow && (
              <div
                className={cn(
                  'absolute w-0 h-0 border-4',
                  'border-neutral-900 dark:border-neutral-100',
                  arrowStyles[arrowPlacement]
                )}
              />
            )}
          </div>,
          document.body
        )}
    </>
  );
});

// ============================================
// Info Tooltip Component (convenience wrapper)
// ============================================

export interface InfoTooltipProps {
  content: ReactNode;
  className?: string;
}

export const InfoTooltip = memo(function InfoTooltip({
  content,
  className,
}: InfoTooltipProps) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center w-4 h-4 rounded-full',
          'bg-neutral-200 dark:bg-neutral-700',
          'text-neutral-500 dark:text-neutral-400',
          'text-xs font-medium',
          'hover:bg-neutral-300 dark:hover:bg-neutral-600',
          'transition-colors',
          className
        )}
      >
        ?
      </button>
    </Tooltip>
  );
});

export default Tooltip;
