import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import { DASHBOARD_MENU_ITEMS } from '../../constants/menuItems';
import type { DashboardLayoutProps } from '../../interfaces/dashboard/DashboardLayout.types';

const DashboardLayout = ({ onLogout }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header
        isAuthenticated={true}
        menuItems={DASHBOARD_MENU_ITEMS}
        onLogout={onLogout}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex-1 pt-16">

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          menuItems={DASHBOARD_MENU_ITEMS}
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
