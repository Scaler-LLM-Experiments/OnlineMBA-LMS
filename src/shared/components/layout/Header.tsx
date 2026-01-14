/**
 * Header Component
 * Online MBA - Top navigation bar
 */

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_CONFIG, STORAGE_KEYS } from '../../../core/config/constants';
import { User as UserType } from '../../../core/types';
import { Button, IconButton } from '../ui/Button';

// ============================================
// Types
// ============================================

interface HeaderProps {
  user: UserType | null;
  onMenuClick: () => void;
  onLogout: () => void;
  isCollapsed?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

// ============================================
// Header Component
// ============================================

export const Header = memo(function Header({
  user,
  onMenuClick,
  onLogout,
  isCollapsed = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.theme);
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.theme, next ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', next);
      }
      return next;
    });
  }, []);

  // Initialize dark mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [isDark]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSearch(false);
    }
  }, [navigate]);

  // Get user initials
  const getUserInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40',
        'h-16 px-4 lg:px-6',
        'bg-white/80 dark:bg-neutral-950/80',
        'backdrop-blur-xl',
        'border-b border-neutral-200 dark:border-neutral-800',
        'flex items-center justify-between gap-4',
        'transition-all duration-300',
        // Adjust for sidebar width
        isCollapsed ? 'left-20' : 'left-0 lg:left-64'
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <IconButton
          variant="ghost"
          size="md"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </IconButton>

        {/* Mobile Logo */}
        <Link
          to="/overview"
          className="flex items-center gap-2 lg:hidden"
          aria-label={APP_CONFIG.name}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-neutral-900 dark:text-white">
            {APP_CONFIG.name}
          </span>
        </Link>

        {/* Search (Desktop) */}
        <div className="hidden md:block relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              placeholder="Search courses, sessions..."
              className={cn(
                'w-64 lg:w-80 h-10 pl-10 pr-4',
                'bg-neutral-100 dark:bg-neutral-800',
                'text-neutral-900 dark:text-neutral-100',
                'placeholder-neutral-500',
                'rounded-xl border-none',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                'transition-all duration-200'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Toggle */}
        <IconButton
          variant="ghost"
          size="md"
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden"
          aria-label="Toggle search"
        >
          <Search className="w-5 h-5" />
        </IconButton>

        {/* Theme Toggle */}
        <IconButton
          variant="ghost"
          size="md"
          onClick={toggleDarkMode}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </IconButton>

        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <IconButton
            variant="ghost"
            size="md"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
          </IconButton>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <NotificationsDropdown
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={cn(
              'flex items-center gap-2 p-1.5 rounded-xl',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'transition-colors duration-200'
            )}
            aria-label="Profile menu"
            aria-expanded={showProfile}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-lg overflow-hidden',
                'bg-gradient-to-br from-primary-500 to-primary-600',
                'flex items-center justify-center',
                'text-white text-sm font-semibold'
              )}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getUserInitials(user?.name || 'User')
              )}
            </div>

            {/* Name (Desktop) */}
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-neutral-500">{user?.batch || ''}</p>
            </div>

            <ChevronDown className="w-4 h-4 text-neutral-400 hidden lg:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <ProfileDropdown
              user={user}
              onLogout={() => {
                setShowProfile(false);
                onLogout();
              }}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 p-4 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              placeholder="Search..."
              autoFocus
              className={cn(
                'w-full h-10 pl-10 pr-4',
                'bg-neutral-100 dark:bg-neutral-800',
                'text-neutral-900 dark:text-neutral-100',
                'rounded-xl border-none',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch((e.target as HTMLInputElement).value);
                }
                if (e.key === 'Escape') {
                  setShowSearch(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </header>
  );
});

// ============================================
// Notifications Dropdown
// ============================================

interface NotificationsDropdownProps {
  onClose: () => void;
}

const NotificationsDropdown = memo(function NotificationsDropdown({
  onClose,
}: NotificationsDropdownProps) {
  // Sample notifications - replace with actual data
  const notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'New Assignment Posted',
      message: 'Marketing Strategy Case Study is due next week',
      type: 'info',
      read: false,
      createdAt: '5 min ago',
    },
    {
      id: '2',
      title: 'Live Session Starting',
      message: 'Business Analytics session starts in 30 minutes',
      type: 'warning',
      read: false,
      createdAt: '30 min ago',
    },
    {
      id: '3',
      title: 'Grade Published',
      message: 'Your Financial Management exam has been graded',
      type: 'success',
      read: true,
      createdAt: '2 hours ago',
    },
  ];

  return (
    <div
      className={cn(
        'absolute top-full right-0 mt-2',
        'w-80 max-h-[400px]',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-2xl shadow-xl',
        'overflow-hidden',
        'animate-scale-in'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          Notifications
        </h3>
        <button className="text-sm text-primary-500 hover:text-primary-600">
          Mark all read
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[300px]">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            className={cn(
              'w-full px-4 py-3 text-left',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              'border-b border-neutral-100 dark:border-neutral-800 last:border-none',
              'transition-colors duration-200',
              !notification.read && 'bg-primary-50/50 dark:bg-primary-950/20'
            )}
            onClick={onClose}
          >
            <div className="flex items-start gap-3">
              {!notification.read && (
                <span className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
              )}
              <div className={cn('flex-1 min-w-0', notification.read && 'ml-5')}>
                <p className="font-medium text-neutral-900 dark:text-white text-sm truncate">
                  {notification.title}
                </p>
                <p className="text-sm text-neutral-500 truncate">
                  {notification.message}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {notification.createdAt}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <Link
        to="/notifications"
        className="block px-4 py-3 text-center text-sm font-medium text-primary-500 hover:text-primary-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-800"
        onClick={onClose}
      >
        View all notifications
      </Link>
    </div>
  );
});

// ============================================
// Profile Dropdown
// ============================================

interface ProfileDropdownProps {
  user: UserType | null;
  onLogout: () => void;
  onClose: () => void;
}

const ProfileDropdown = memo(function ProfileDropdown({
  user,
  onLogout,
  onClose,
}: ProfileDropdownProps) {
  const menuItems = [
    { icon: User, label: 'My Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  return (
    <div
      className={cn(
        'absolute top-full right-0 mt-2',
        'w-64',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-2xl shadow-xl',
        'overflow-hidden',
        'animate-scale-in'
      )}
    >
      {/* User Info */}
      <div className="px-4 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <p className="font-semibold text-neutral-900 dark:text-white">
          {user?.name || 'User'}
        </p>
        <p className="text-sm text-neutral-500 truncate">{user?.email}</p>
        {user?.batch && (
          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            {user.batch}
          </span>
        )}
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5',
              'text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              'transition-colors duration-200'
            )}
            onClick={onClose}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 py-2">
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-2.5',
            'text-error-600 dark:text-error-400',
            'hover:bg-error-50 dark:hover:bg-error-950/30',
            'transition-colors duration-200'
          )}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </div>
  );
});

export default Header;
