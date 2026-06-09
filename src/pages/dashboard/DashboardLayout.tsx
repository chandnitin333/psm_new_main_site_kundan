import { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import PageTracker from '../../components/PageTracker';
import { DASHBOARD_MENU_ITEMS } from '../../constants/menuItems';
import { filterMenuItems } from '../../utils/permissions';
import type { DashboardLayoutProps } from '../../interfaces/dashboard/DashboardLayout.types';

const DashboardLayout = ({ onLogout }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Show only the menus/submenus this user is allowed to access
  const menuItems = useMemo(() => filterMenuItems(DASHBOARD_MENU_ITEMS), []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <PageTracker />
      <Header
        isAuthenticated={true}
        menuItems={menuItems}
        onLogout={onLogout}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex-1 pt-16">

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          menuItems={menuItems}
        />

        {/* Main Content */}
        <main className={`transition-all duration-300 bg-white dark:bg-gray-900 ${isSidebarOpen ? 'lg:pr-64' : 'pr-0'}`}>
          <div className="container mx-auto px-4 bg-white dark:bg-gray-900">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
