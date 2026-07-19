import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from '../ScrollToTop';
import { PUBLIC_MENU_ITEMS } from '../../constants/menuItems';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <ScrollToTop />
      <Header isAuthenticated={false} menuItems={PUBLIC_MENU_ITEMS} />
      <main className="flex-1 pt-16 bg-white dark:bg-gray-900">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
