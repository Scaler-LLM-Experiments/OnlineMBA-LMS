import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  FolderOpen,
  Calendar,
  FileText,
  User,
  Menu,
  BarChart3,
  Users,
  Video,
  Shield,
  ListChecks,
  GraduationCap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navigation = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Dashboard', href: '/dashboards', icon: BarChart3 },
  { name: 'Sessions', href: '/sessions', icon: Video },
  { name: 'Events & Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Resources', href: '/resources', icon: FolderOpen },
  { name: 'Students Corner', href: '/students-corner', icon: Users },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Forms', href: '/forms', icon: ListChecks },
  { name: 'Exams', href: '/exams', icon: GraduationCap },
  { name: 'Policy & Documents', href: '/policies', icon: FileText },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { student } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Add Admin to navigation if user is admin
  // Use useMemo to ensure this updates when student.isAdmin changes
  const allNavigation = useMemo(() => [
    ...navigation,
    ...(student?.isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : [])
  ], [student?.isAdmin]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border">
            <div className="flex items-center space-x-3">
              {/* Logo with green background for better visibility */}
              <div className="flex items-center bg-primary rounded-lg p-2">
                <img
                  src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234"
                  alt="SSB Logo"
                  className="h-6 w-auto"
                />
              </div>
              <span className="text-lg font-semibold text-foreground">SSB Portal</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {allNavigation.map((item: any) => {
              const isActive = location.pathname === item.href;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.name);
              const isSubItemActive = hasSubItems && item.subItems?.some((subItem: any) => location.pathname === subItem.href);

              return (
                <div key={item.name}>
                  {/* Main navigation item */}
                  <div className="relative">
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isSubItemActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {item.name}
                      {hasSubItems && (
                        <button
                          className="ml-auto p-1 rounded hover:bg-accent/50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpanded(item.name);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </NavLink>
                  </div>

                  {/* Sub-items */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems?.map((subItem: any) => {
                        const isSubActive = location.pathname === subItem.href;
                        return (
                          <NavLink
                            key={subItem.name}
                            to={subItem.href}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isSubActive
                                ? "bg-primary/80 text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            {subItem.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </div>
      </div>
    </>
  );
};

export default Sidebar;