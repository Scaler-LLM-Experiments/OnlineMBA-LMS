/**
 * Sidebar Component
 * Online MBA - Main navigation sidebar
 */

import React, { memo, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  FileText,
  ClipboardList,
  BookOpen,
  Bell,
  Calendar,
  FileCheck,
  Shield,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  X,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_CONFIG, NAV_ITEMS } from '../../../core/config/constants';

// ============================================
// Types
// ============================================

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  children?: Array<{
    id: string;
    label: string;
    path: string;
  }>;
  badge?: number | string;
  isNew?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isAdmin?: boolean;
}

// ============================================
// Icon Map
// ============================================

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Video,
  FileText,
  ClipboardList,
  BookOpen,
  Bell,
  Calendar,
  FileCheck,
  Shield,
  Users,
  Settings,
  GraduationCap,
};

// ============================================
// Navigation Items
// ============================================

const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/overview',
    icon: 'LayoutDashboard',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    path: '/sessions',
    icon: 'Video',
  },
  {
    id: 'exams',
    label: 'Exams',
    path: '/exams',
    icon: 'FileText',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    path: '/assignments',
    icon: 'ClipboardList',
  },
  {
    id: 'resources',
    label: 'Resources',
    path: '/resources',
    icon: 'BookOpen',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    path: '/announcements',
    icon: 'Bell',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: 'Calendar',
  },
  {
    id: 'forms',
    label: 'Forms',
    path: '/forms',
    icon: 'FileCheck',
  },
  {
    id: 'policies',
    label: 'Policies',
    path: '/policies',
    icon: 'Shield',
  },
  {
    id: 'community',
    label: 'Community',
    path: '/students-corner',
    icon: 'Users',
  },
];

const adminItems: NavItem[] = [
  {
    id: 'admin',
    label: 'Admin Panel',
    path: '/admin',
    icon: 'Settings',
  },
];

// ============================================
// Sidebar Component
// ============================================

export const Sidebar = memo(function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  isAdmin = false,
}: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Toggle submenu
  const toggleSubmenu = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Check if path is active
  const isPathActive = useCallback(
    (path: string, exact = false) => {
      if (exact) {
        return location.pathname === path;
      }
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  // Auto-expand active parent items
  React.useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          isPathActive(child.path, true)
        );
        if (hasActiveChild) {
          setExpandedItems((prev) => new Set(prev).add(item.id));
        }
      }
    });
  }, [location.pathname, isPathActive]);

  // Combine nav items
  const allItems = useMemo(() => {
    return isAdmin ? [...navigationItems, ...adminItems] : navigationItems;
  }, [isAdmin]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full',
          'bg-white dark:bg-neutral-950',
          'border-r border-neutral-200 dark:border-neutral-800',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          // Width
          isCollapsed ? 'w-20' : 'w-64',
          // Mobile visibility
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center px-4',
            'border-b border-neutral-200 dark:border-neutral-800',
            isCollapsed ? 'justify-center h-16' : 'justify-between h-20'
          )}
        >
          {/* Logo */}
          <NavLink
            to="/overview"
            className="flex items-center group"
            aria-label={APP_CONFIG.name}
          >
            {isCollapsed ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src="https://lh3.googleusercontent.com/d/1NFXV17i1OF2BsdGjyaTc2Dh13H-GdXjl"
                  alt="Scaler"
                  className="h-8 object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <img
                  src="https://lh3.googleusercontent.com/d/1NFXV17i1OF2BsdGjyaTc2Dh13H-GdXjl"
                  alt="Scaler"
                  className="h-8 object-contain"
                />
                <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-600" />
                <div className="flex flex-col">
                  <span className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">SCALER</span>
                  <span className="text-[10px] text-[#fd621b] font-medium leading-tight">Online PGP in Business and AI</span>
                </div>
              </div>
            )}
          </NavLink>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3"
          aria-label="Main navigation"
        >
          <ul className="space-y-1">
            {allItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleSubmenu(item.id)}
                isActive={isPathActive(item.path)}
                isPathActive={isPathActive}
              />
            ))}
          </ul>
        </nav>

        {/* Footer - Collapse Toggle (Desktop Only) */}
        <div className="hidden lg:block p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg',
              'text-neutral-600 dark:text-neutral-400',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'hover:text-neutral-900 dark:hover:text-neutral-100',
              'transition-colors duration-200',
              isCollapsed && 'justify-center'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRight
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                !isCollapsed && 'rotate-180'
              )}
            />
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
});

// ============================================
// Nav Item Component
// ============================================

interface NavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  isPathActive: (path: string, exact?: boolean) => boolean;
}

const NavItem = memo(function NavItem({
  item,
  isCollapsed,
  isExpanded,
  onToggle,
  isActive,
  isPathActive,
}: NavItemProps) {
  const Icon = iconMap[item.icon] || LayoutDashboard;
  const hasChildren = item.children && item.children.length > 0;

  // Base link/button styles
  const linkStyles = cn(
    'flex items-center gap-3 w-full p-3 rounded-xl',
    'text-sm font-medium',
    'transition-all duration-200',
    isCollapsed && 'justify-center',
    isActive
      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
  );

  // Render with or without children
  if (hasChildren && !isCollapsed) {
    return (
      <li>
        <button
          onClick={onToggle}
          className={linkStyles}
          aria-expanded={isExpanded}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </button>

        {/* Submenu */}
        {isExpanded && (
          <ul className="mt-1 ml-8 space-y-1">
            {item.children!.map((child) => (
              <li key={child.id}>
                <NavLink
                  to={child.path}
                  className={({ isActive }) =>
                    cn(
                      'block p-2 rounded-lg text-sm',
                      'transition-colors duration-200',
                      isActive || isPathActive(child.path, true)
                        ? 'text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    )
                  }
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Regular nav item
  return (
    <li>
      <NavLink
        to={item.path}
        className={linkStyles}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="flex-1">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            {item.badge}
          </span>
        )}
        {!isCollapsed && item.isNew && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400">
            New
          </span>
        )}
      </NavLink>
    </li>
  );
});

export default Sidebar;
