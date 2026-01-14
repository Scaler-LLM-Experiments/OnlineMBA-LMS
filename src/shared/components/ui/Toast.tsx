/**
 * Toast Component
 * Online MBA - Notification toasts and alerts
 */

import React, {
  memo,
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: Toast['action'];
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
}

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================
// Toast Provider
// ============================================

export interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider = memo(function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, options: ToastOptions = {}): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = {
        id,
        message,
        type: options.type || 'info',
        title: options.title,
        duration: options.duration ?? 5000,
        dismissible: options.dismissible ?? true,
        action: options.action,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Limit max toasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [maxToasts]
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) =>
      addToast(message, { ...options, type: 'success' }),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) =>
      addToast(message, { ...options, type: 'error' }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) =>
      addToast(message, { ...options, type: 'warning' }),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) =>
      addToast(message, { ...options, type: 'info' }),
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  );
});

// ============================================
// Toast Container
// ============================================

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
  onRemove: (id: string) => void;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

const ToastContainer = memo(function ToastContainer({
  toasts,
  position,
  onRemove,
}: ToastContainerProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-[9999] flex flex-col gap-2',
        positionStyles[position],
        position.includes('bottom') ? 'flex-col-reverse' : 'flex-col'
      )}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
});

// ============================================
// Toast Item
// ============================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircle; className: string }
> = {
  success: {
    icon: CheckCircle,
    className: 'text-success-500 bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-800',
  },
  error: {
    icon: XCircle,
    className: 'text-error-500 bg-error-50 dark:bg-error-950/30 border-error-200 dark:border-error-800',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-warning-500 bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800',
  },
  info: {
    icon: Info,
    className: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-950/30 border-secondary-200 dark:border-secondary-800',
  },
};

const ToastItem = memo(function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 200);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 w-80 max-w-full',
        'border rounded-xl shadow-lg',
        'transition-all duration-200',
        config.className,
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-slide-in'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {toast.dismissible && (
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      )}
    </div>
  );
});

// ============================================
// Alert Component (inline variant)
// ============================================

export interface AlertProps {
  /** Alert type */
  type?: ToastType;
  /** Title */
  title?: string;
  /** Message content */
  children: ReactNode;
  /** Dismissible */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom class name */
  className?: string;
}

export const Alert = memo(function Alert({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  className,
}: AlertProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4',
        'border rounded-xl',
        config.className,
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            {title}
          </p>
        )}
        <div className="text-sm text-neutral-700 dark:text-neutral-300">{children}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      )}
    </div>
  );
});

export default ToastProvider;
