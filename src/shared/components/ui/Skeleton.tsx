/**
 * Skeleton Component
 * Online MBA - Loading skeletons and placeholders
 */

import React, { memo, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface SkeletonProps {
  /** Width (CSS value) */
  width?: string | number;
  /** Height (CSS value) */
  height?: string | number;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Animation */
  animation?: 'pulse' | 'wave' | 'none';
  /** Custom class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Last line width percentage */
  lastLineWidth?: number;
  /** Line height */
  lineHeight?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

// ============================================
// Skeleton Component
// ============================================

export const Skeleton = memo(function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className,
  style,
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-xl';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'wave':
        return 'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 bg-[length:400%_100%]';
      case 'none':
        return '';
      case 'pulse':
      default:
        return 'animate-pulse';
    }
  };

  return (
    <div
      className={cn(
        'bg-neutral-200 dark:bg-neutral-700',
        getVariantStyles(),
        getAnimationStyles(),
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
        ...style,
      }}
    />
  );
});

// ============================================
// Skeleton Text Component
// ============================================

const lineHeights = {
  sm: 'h-3 mb-2',
  md: 'h-4 mb-2.5',
  lg: 'h-5 mb-3',
};

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  lastLineWidth = 60,
  lineHeight = 'md',
  className,
}: SkeletonTextProps) {
  return (
    <div className={className}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            lineHeights[lineHeight],
            i === lines - 1 && `w-[${lastLineWidth}%]`
          )}
          style={{
            width: i === lines - 1 ? `${lastLineWidth}%` : '100%',
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// Skeleton Avatar Component
// ============================================

export interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 'md',
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      variant="circular"
      className={cn(avatarSizes[size], className)}
    />
  );
});

// ============================================
// Card Skeleton Component
// ============================================

export interface CardSkeletonProps {
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Show action buttons */
  showActions?: boolean;
  /** Custom class name */
  className?: string;
}

export const CardSkeleton = memo(function CardSkeleton({
  showImage = false,
  lines = 3,
  showActions = false,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-xl overflow-hidden',
        className
      )}
    >
      {showImage && (
        <Skeleton variant="rectangular" className="w-full h-48" />
      )}
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <SkeletonText lines={lines} />
        {showActions && (
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================
// Table Row Skeleton Component
// ============================================

export interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export const TableRowSkeleton = memo(function TableRowSkeleton({
  columns = 5,
  rows = 5,
  className,
}: TableRowSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3 px-4 bg-white dark:bg-neutral-900 rounded-lg">
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-4 flex-1"
              style={{ maxWidth: colIndex === 0 ? '40%' : '20%' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
});

// ============================================
// List Item Skeleton Component
// ============================================

export interface ListItemSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const ListItemSkeleton = memo(function ListItemSkeleton({
  count = 3,
  showAvatar = true,
  showSubtitle = true,
  className,
}: ListItemSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          {showAvatar && <SkeletonAvatar />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            {showSubtitle && <Skeleton className="h-3 w-1/2" />}
          </div>
        </div>
      ))}
    </div>
  );
});

// ============================================
// Stats Card Skeleton Component
// ============================================

export interface StatsCardSkeletonProps {
  className?: string;
}

export const StatsCardSkeleton = memo(function StatsCardSkeleton({
  className,
}: StatsCardSkeletonProps) {
  return (
    <div
      className={cn(
        'p-6 bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-xl',
        className
      )}
    >
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
});

// ============================================
// Page Skeleton Component
// ============================================

export interface PageSkeletonProps {
  /** Show header */
  showHeader?: boolean;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Content type */
  contentType?: 'cards' | 'table' | 'list' | 'form';
  /** Custom class name */
  className?: string;
}

export const PageSkeleton = memo(function PageSkeleton({
  showHeader = true,
  showSidebar = false,
  contentType = 'cards',
  className,
}: PageSkeletonProps) {
  const renderContent = () => {
    switch (contentType) {
      case 'table':
        return <TableRowSkeleton rows={8} />;
      case 'list':
        return <ListItemSkeleton count={8} />;
      case 'form':
        return (
          <div className="space-y-6 max-w-lg">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        );
      case 'cards':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} showImage lines={2} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={cn('min-h-screen', className)}>
      {showHeader && (
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center">
          <Skeleton className="h-8 w-40" />
          <div className="ml-auto flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <SkeletonAvatar />
          </div>
        </div>
      )}

      <div className="flex">
        {showSidebar && (
          <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        )}

        <div className="flex-1 p-6">
          {showHeader && (
            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
});

// ============================================
// Inline Skeleton Wrapper
// ============================================

export interface InlineSkeletonProps {
  /** Loading state */
  loading: boolean;
  /** Content to show when not loading */
  children: ReactNode;
  /** Skeleton width */
  width?: string | number;
  /** Skeleton height */
  height?: string | number;
  /** Custom class name */
  className?: string;
}

export const InlineSkeleton = memo(function InlineSkeleton({
  loading,
  children,
  width,
  height,
  className,
}: InlineSkeletonProps) {
  if (loading) {
    return <Skeleton width={width} height={height} className={className} />;
  }

  return <>{children}</>;
});

export default Skeleton;
