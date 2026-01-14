/**
 * Dashboard Layout Component
 * Online MBA - Main layout wrapper with sidebar and header
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../../../core/types';
import { ErrorBoundary } from '../../../core/errors/ErrorBoundary';

// ============================================
// Types
// ============================================

interface DashboardLayoutProps {
  user: User | null;
  isAdmin?: boolean;
  onLogout: () => void;
}

// ============================================
// Constants
// ============================================

const MOBILE_BREAKPOINT = 1024;
const SIDEBAR_COLLAPSED_KEY = 'omba_sidebar_collapsed';

// ============================================
// Dashboard Layout Component
// ============================================

export const DashboardLayout = memo(function DashboardLayout({
  user,
  isAdmin = false,
  onLogout,
}: DashboardLayoutProps) {
  const navigate = useNavigate();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return stored === 'true';
    }
    return false;
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [navigate]);

  // Toggle sidebar (mobile)
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Close sidebar (mobile)
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Toggle sidebar collapse (desktop)
  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    onLogout();
    navigate('/login');
  }, [onLogout, navigate]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isAdmin={isAdmin}
      />

      {/* Header */}
      <Header
        user={user}
        onMenuClick={handleToggleSidebar}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-16',
          'transition-all duration-300',
          // Adjust for sidebar width
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <div className="p-4 lg:p-6">
          <ErrorBoundary level="section">
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
});

// ============================================
// Page Wrapper Component
// ============================================

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthStyles: Record<string, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

export const PageWrapper = memo(function PageWrapper({
  children,
  className,
  maxWidth = 'xl',
}: PageWrapperProps) {
  return (
    <div className={cn('mx-auto', maxWidthStyles[maxWidth], className)}>
      {children}
    </div>
  );
});

// ============================================
// Page Header Component
// ============================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader = memo(function PageHeader({
  title,
  subtitle,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6',
        className
      )}
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
});

// ============================================
// Content Section Component
// ============================================

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ContentSection = memo(function ContentSection({
  title,
  subtitle,
  action,
  children,
  className,
}: ContentSectionProps) {
  return (
    <section className={cn('mb-8', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
});

// ============================================
// Grid Components
// ============================================

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

const gridColStyles: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

const gridGapStyles: Record<string, string> = {
  sm: 'gap-3',
  md: 'gap-4 lg:gap-6',
  lg: 'gap-6 lg:gap-8',
};

export const Grid = memo(function Grid({
  children,
  className,
  cols = 3,
  gap = 'md',
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        gridColStyles[cols],
        gridGapStyles[gap],
        className
      )}
    >
      {children}
    </div>
  );
});

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-4',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 text-neutral-300 dark:text-neutral-700">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
});

// ============================================
// Loading State Component
// ============================================

interface LoadingStateProps {
  text?: string;
  className?: string;
}

export const LoadingState = memo(function LoadingState({
  text = 'Loading...',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'py-12',
        className
      )}
    >
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-neutral-500 dark:text-neutral-400">{text}</p>
    </div>
  );
});

export default DashboardLayout;
