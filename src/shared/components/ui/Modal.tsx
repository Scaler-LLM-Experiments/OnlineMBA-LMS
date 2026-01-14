/**
 * Modal Component
 * Online MBA - Dialog/Modal implementation
 */

import React, {
  memo,
  forwardRef,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { IconButton } from './Button';

// ============================================
// Types
// ============================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Footer content */
  footer?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether to center content vertically */
  centered?: boolean;
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ============================================
// Styles
// ============================================

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

// ============================================
// Modal Component
// ============================================

export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  className,
  centered = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      contentRef.current?.focus();
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-50',
        'bg-black/60 backdrop-blur-sm',
        'flex p-4',
        centered ? 'items-center justify-center' : 'items-start justify-center pt-20',
        'animate-fade-in'
      )}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={contentRef}
        className={cn(
          'relative w-full',
          'bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-800',
          'rounded-2xl shadow-2xl',
          'animate-scale-in',
          'focus:outline-none',
          sizeStyles[size],
          className
        )}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <ModalHeader
            title={title}
            description={description}
            onClose={onClose}
            showCloseButton={showCloseButton}
          />
        )}

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>,
    document.body
  );
});

// ============================================
// Modal Header Component
// ============================================

export const ModalHeader = memo(
  forwardRef<HTMLDivElement, ModalHeaderProps>(
    ({ title, description, onClose, showCloseButton = true, className, ...props }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-start justify-between gap-4',
            'px-6 py-4',
            'border-b border-neutral-200 dark:border-neutral-800',
            className
          )}
          {...props}
        >
          <div>
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-neutral-900 dark:text-white"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-sm text-neutral-500 dark:text-neutral-400"
              >
                {description}
              </p>
            )}
          </div>
          {showCloseButton && onClose && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
              className="flex-shrink-0 -mr-2 -mt-1"
            >
              <X className="w-5 h-5" />
            </IconButton>
          )}
        </div>
      );
    }
  )
);

ModalHeader.displayName = 'ModalHeader';

// ============================================
// Modal Footer Component
// ============================================

export const ModalFooter = memo(
  forwardRef<HTMLDivElement, ModalFooterProps>(({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3',
          'px-6 py-4',
          'border-t border-neutral-200 dark:border-neutral-800',
          'bg-neutral-50 dark:bg-neutral-900/50',
          'rounded-b-2xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);

ModalFooter.displayName = 'ModalFooter';

// ============================================
// Confirm Modal Component
// ============================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-neutral-600 dark:text-neutral-400">{message}</p>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium',
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            'transition-colors duration-200',
            'disabled:opacity-50'
          )}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium',
            'transition-colors duration-200',
            'disabled:opacity-50',
            variant === 'danger'
              ? 'bg-error-500 hover:bg-error-600 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          )}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </div>
    </Modal>
  );
});

export default Modal;
