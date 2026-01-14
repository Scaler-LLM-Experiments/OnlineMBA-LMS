import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import RequiredFormsModal from '../RequiredFormsModal';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  // Auto-collapse sidebar on Sessions and My Notes pages
  const shouldCollapseSidebar = location.pathname === '/sessions' || location.pathname === '/my-notes';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-collapse sidebar when navigating to Sessions or My Notes
  useEffect(() => {
    if (shouldCollapseSidebar) {
      setSidebarOpen(false);
    } else {
      // On desktop, keep sidebar open for other pages
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    }
  }, [location.pathname, shouldCollapseSidebar]);

  return (
    <div className="h-screen flex bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Required Forms Modal - shows on all pages until filled */}
      <RequiredFormsModal />
    </div>
  );
};

export default DashboardLayout;