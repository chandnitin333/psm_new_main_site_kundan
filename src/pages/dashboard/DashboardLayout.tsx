import { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import PageTracker from '../../components/PageTracker';
import ScrollToTop from '../../components/ScrollToTop';
import GramSahayak from '../../components/assistant/GramSahayak';
import { DASHBOARD_MENU_ITEMS, CITIZEN_MENU_ITEMS } from '../../constants/menuItems';
import { filterMenuItems, isCitizen } from '../../utils/permissions';
import type { DashboardLayoutProps } from '../../interfaces/dashboard/DashboardLayout.types';

const DashboardLayout = ({ onLogout }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Citizens get only their own "माझी मालमत्ता" menu; everyone else gets the
  // regular dashboard menu filtered by their permissions.
  const menuItems = useMemo(
    () => (isCitizen() ? CITIZEN_MENU_ITEMS : filterMenuItems(DASHBOARD_MENU_ITEMS)),
    [],
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <ScrollToTop />
      <PageTracker />
      <Header
        isAuthenticated={true}
        menuItems={menuItems}
        onLogout={onLogout}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex-1 pt-16 print:pt-0">

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          menuItems={menuItems}
        />

        {/* Main Content */}
        <main className={`transition-all duration-300 bg-white dark:bg-gray-900 print:!pr-0 ${isSidebarOpen ? 'lg:pr-64' : 'pr-0'}`}>
          <div className="container mx-auto px-4 bg-white dark:bg-gray-900 print:max-w-none print:px-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI-free guided assistant — floating on all dashboard pages */}
      <GramSahayak />
    </div>
  );
};

export default DashboardLayout;
