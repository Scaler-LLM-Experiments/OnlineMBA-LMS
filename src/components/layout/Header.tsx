import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, User, LogOut, Video, Film, FileEdit } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { apiService, type StudentProfile, type FullStudentProfile } from '../../services/api';
import toast from 'react-hot-toast';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = React.useState(() => {
    // Set dark theme as default
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : true; // Default to dark
  });
  const [userProfile, setUserProfile] = useState<StudentProfile | null>(null);
  const [fullProfile, setFullProfile] = useState<FullStudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const user = auth.currentUser;

  // Session tabs configuration
  const tabs = [
    { id: 'sessions', label: 'Live & Upcoming', icon: Video, path: '/sessions' },
    { id: 'recordings', label: 'Recordings', icon: Film, path: '/sessions?tab=recordings' },
    { id: 'notes', label: 'My Notes', icon: FileEdit, path: '/my-notes' },
  ];

  // Check if we're on a sessions-related page - only show tabs on My Notes page
  const showTabs = location.pathname === '/my-notes';

  // Show menu button on desktop for Sessions/Notes pages (sidebar is collapsed)
  const showMenuOnDesktop = location.pathname === '/sessions' || location.pathname === '/my-notes';

  // Check if we're on assignment pages
  const isAssignmentPage = location.pathname === '/assignments' || location.pathname === '/assignments-platform' || location.pathname.startsWith('/assignments-platform/');

  useEffect(() => {
    // Apply dark theme by default on first load
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) {
        setProfileLoading(false);
        return;
      }
      
      try {
        setProfileLoading(true);
        
        // Get basic profile for name
        const result = await apiService.getStudentProfile(user.email);
        if (result.success && result.data) {
          setUserProfile(result.data);
        }
        
        // Get full profile for profile picture
        const fullResult = await apiService.getFullStudentProfile(user.email);
        if (fullResult.success && fullResult.data) {
          console.log('Header: Full profile data received:', fullResult.data);
          console.log('Header: Profile picture URL:', fullResult.data.profilePicture);
          setFullProfile(fullResult.data);
        } else {
          console.error('Header: Failed to get full profile:', fullResult.error);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu Button + Welcome Message */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={showMenuOnDesktop ? "" : "lg:hidden"}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {isAssignmentPage ? (
              // For assignment pages: just show welcome message
              <p className="text-lg text-muted-foreground whitespace-nowrap">
                {profileLoading ? (
                  <span className="opacity-50">Loading...</span>
                ) : (
                  <span className="animate-fadeIn">
                    Welcome, {userProfile?.fullName || 'Student'}
                  </span>
                )}
              </p>
            ) : (
              // For other pages: show welcome message and tabs if applicable
              <div className="flex items-center gap-6">
                <p className="text-lg text-muted-foreground">
                  {profileLoading ? (
                    <span className="opacity-50">Loading...</span>
                  ) : (
                    <span className="animate-fadeIn">
                      Welcome back, {userProfile?.fullName || 'Student'}
                    </span>
                  )}
                </p>

                {/* Session Tabs - shown only on sessions and my-notes pages */}
                {showTabs && (
                  <div className="flex gap-1 ml-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive =
                        (tab.id === 'notes' && location.pathname === '/my-notes') ||
                        (tab.id === 'sessions' && location.pathname === '/sessions') ||
                        (tab.id === 'recordings' && location.pathname === '/sessions' && location.search.includes('tab=recordings'));

                      return (
                        <button
                          key={tab.id}
                          onClick={() => navigate(tab.path)}
                          className={`
                            flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium transition-all text-sm
                            ${isActive
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Section - Assignment Dashboard Title */}
          {isAssignmentPage && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                Assignment Dashboard
              </h1>
            </div>
          )}

          {/* Right Section - Theme Toggle + Profile */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 hover:bg-accent"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-yellow-500 hover:text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600 hover:text-slate-800" />
              )}
            </Button>

            {!isAssignmentPage && (
              <div className="flex items-center space-x-2">
                <DropdownMenu
                  align="right"
                  trigger={
                    <div className="relative cursor-pointer">
                      <Avatar className="w-8 h-8 hover:ring-2 hover:ring-accent transition-all duration-200">
                        <AvatarImage
                          src={fullProfile?.profilePicture}
                          alt={userProfile?.fullName || 'User'}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const currentSrc = target.src;
                            console.log('Header profile image failed to load:', currentSrc);
                            console.log('Header original URL from backend:', fullProfile?.profilePicture);

                            // Check if we've already retried to prevent infinite loops
                            if (target.dataset.retried === 'true') {
                              console.log('Header: Already retried, showing fallback avatar');
                              target.removeAttribute('src');
                              return;
                            }

                            // Handle both old and new Google Drive URL formats
                            if (currentSrc && (currentSrc.includes('googleusercontent.com') || currentSrc.includes('drive.google.com'))) {
                              let fileId = '';

                              // Extract file ID from different Google Drive URL formats
                              if (currentSrc.includes('googleusercontent.com')) {
                                // Format: https://lh3.googleusercontent.com/d/FILE_ID=w400-h400
                                const match = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                fileId = match?.[1] || '';
                              } else if (currentSrc.includes('drive.google.com')) {
                                // Format: https://drive.google.com/file/d/FILE_ID/view
                                const match = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                fileId = match?.[1] || '';
                              }

                              if (fileId) {
                                const newUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                                console.log('Header: Converting Google Drive URL to direct format:', newUrl);
                                target.dataset.retried = 'true';
                                target.src = newUrl;
                                return;
                              }
                            }

                            // For all other URLs or failed conversions
                            console.log('Header: Unable to load image, showing fallback avatar');
                            target.removeAttribute('src');
                          }}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium">
                          {userProfile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                  }
                >
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <div className="flex items-center space-x-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;