/**
 * Avatar Component
 * Online MBA - User avatars and avatar groups
 */

import React, { memo, useState, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** User name for fallback initials */
  name?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Shape variant */
  shape?: 'circle' | 'rounded';
  /** Show online status */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** Custom fallback content */
  fallback?: ReactNode;
  /** Custom class name */
  className?: string;
}

export interface AvatarGroupProps {
  /** Avatar items */
  children: ReactNode;
  /** Maximum avatars to show */
  max?: number;
  /** Size variant */
  size?: AvatarProps['size'];
  /** Custom class name */
  className?: string;
}

// ============================================
// Styles
// ============================================

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-2',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  away: 'bg-warning-500',
  busy: 'bg-error-500',
};

// ============================================
// Helper Functions
// ============================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToColor(str: string): string {
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-error-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// ============================================
// Avatar Component
// ============================================

export const Avatar = memo(function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  fallback,
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showImage = src && !imageError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? stringToColor(name) : 'bg-neutral-500';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden',
        sizeStyles[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : fallback ? (
        <div className={cn('w-full h-full flex items-center justify-center', bgColor, 'text-white')}>
          {fallback}
        </div>
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center font-semibold',
            bgColor,
            'text-white'
          )}
        >
          {initials}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white dark:border-neutral-900',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
});

// ============================================
// Avatar Group Component
// ============================================

export const AvatarGroup = memo(function AvatarGroup({
  children,
  max = 5,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-white dark:ring-neutral-900 rounded-full"
        >
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
            : child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-full ring-2 ring-white dark:ring-neutral-900',
            sizeStyles[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
});

// ============================================
// User Avatar Component (convenience wrapper)
// ============================================

export interface UserAvatarProps {
  user: {
    name?: string;
    email?: string;
    photoURL?: string | null;
    avatar?: string | null;
  };
  size?: AvatarProps['size'];
  status?: AvatarProps['status'];
  showName?: boolean;
  showEmail?: boolean;
  className?: string;
}

export const UserAvatar = memo(function UserAvatar({
  user,
  size = 'md',
  status,
  showName = false,
  showEmail = false,
  className,
}: UserAvatarProps) {
  const name = user.name || user.email?.split('@')[0] || 'User';
  const avatar = user.photoURL || user.avatar;

  if (!showName && !showEmail) {
    return (
      <Avatar
        src={avatar}
        name={name}
        size={size}
        status={status}
        className={className}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar src={avatar} name={name} size={size} status={status} />
      <div className="min-w-0">
        {showName && (
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {name}
          </p>
        )}
        {showEmail && user.email && (
          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
        )}
      </div>
    </div>
  );
});

export default Avatar;
