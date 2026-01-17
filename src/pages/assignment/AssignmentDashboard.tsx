import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../../firebase/config';
import AssignmentListPage from './AssignmentListPage';
import { useRefreshNotification } from '../../hooks/useRefreshNotification';
import { RefreshNotificationBanner } from '../../components/RefreshNotificationBanner';
import { RefreshNotificationModal } from '../../components/RefreshNotificationModal';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export const AssignmentDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  // Refresh notification hook
  const { notification, loading: refreshLoading, acknowledgeRefresh, dismissBanner } = useRefreshNotification();

  // Initialize dark mode from localStorage - default to LIGHT mode (white)
  useEffect(() => {
    const savedMode = localStorage.getItem('assignmentDarkMode');

    // Only enable dark mode if explicitly saved as 'true', otherwise default to light
    const shouldBeDark = savedMode === 'true';

    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;

    // Apply transition instantly by removing transition class temporarily
    document.documentElement.style.transition = 'none';

    setDarkMode(newMode);
    localStorage.setItem('assignmentDarkMode', String(newMode));

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Force reflow to apply changes
    void document.documentElement.offsetHeight;

    // Re-enable transitions
    document.documentElement.style.transition = '';
  };

  const navItems: NavItem[] = [
    { id: 'assignments', label: 'My Assignments', icon: <ClipboardList size={20} />, path: '/assignments-platform' },
  ];

  const isActive = (path: string) => {
    if (path === '/assignments-platform') {
      return location.pathname === '/assignments-platform';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Refresh Notifications - Only shown on Assignment Platform */}
      {notification?.refreshRequired && (
        <>
          {notification.requireFullScreen ? (
            <RefreshNotificationModal
              message={notification.bannerNotice || 'Please refresh to see the latest updates.'}
              onRefresh={acknowledgeRefresh}
              loading={refreshLoading}
            />
          ) : (
            <RefreshNotificationBanner
              message={notification.bannerNotice || 'Please refresh to see the latest updates.'}
              onRefresh={acknowledgeRefresh}
              onDismiss={dismissBanner}
              loading={refreshLoading}
            />
          )}
        </>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b z-30">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Mobile menu + User name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="text-base sm:text-lg text-muted-foreground">
              {user?.displayName || 'Student'}
            </div>
          </div>

          {/* Center: Assignment Dashboard */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              Assignment Dashboard
            </h1>
          </div>

          {/* Right: Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} />
            )}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-16 bottom-0 bg-card border-r z-20 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{ transition: 'width 300ms ease-in-out' }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-card border rounded-full flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <div className="relative flex-shrink-0">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-card border-r z-50"
            style={{ transition: 'transform 300ms ease-in-out' }}
          >
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {item.icon}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <div className="p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<AssignmentListPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AssignmentDashboard;