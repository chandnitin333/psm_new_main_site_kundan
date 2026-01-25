import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../pages/dashboard/DashboardLayout';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import NotFound from '../pages/NotFound';

// Dashboard Pages
import Dashboard from '../pages/dashboard/Dashboard';
import CategoryDetail from '../pages/dashboard/CategoryDetail';
import Profile from '../pages/dashboard/Profile';
import ChangePassword from '../pages/dashboard/ChangePassword';
import Components from '../pages/dashboard/components/Components';
import NodniForm from '../pages/dashboard/nodni-form/NodniForm';
import MalmattaNodni from '../pages/dashboard/malmatta-nodni/MalmattaNodni';
import MalmattaFerfar from '../pages/dashboard/malmatta-ferfar/MalmattaFerfar';
import FerfarForm from '../pages/dashboard/malmatta-ferfar/FerfarForm';
import FerfarPdfManagement from '../pages/dashboard/malmatta-ferfar/FerfarPdfManagement';
import KarAakarani from '../pages/dashboard/kar-aakarani/KarAakarani';
import Vasuli from '../pages/dashboard/vasuli/Vasuli';
import VasuliForm from '../pages/dashboard/vasuli/VasuliForm';
import ViewVasuli from '../pages/dashboard/vasuli/ViewVasuli';
import Ahval from '../pages/dashboard/ahval/Ahval';
import AadharList from '../pages/dashboard/ahval/AadharList';
import AadharReport from '../pages/dashboard/ahval/AadharReport';
import MobileList from '../pages/dashboard/ahval/MobileList';
import MobileReport from '../pages/dashboard/ahval/MobileReport';
import PaniList from '../pages/dashboard/ahval/PaniList';
import PaniReport from '../pages/dashboard/ahval/PaniReport';
import ShouchalayList from '../pages/dashboard/ahval/ShouchalayList';
import ShouchalayReport from '../pages/dashboard/ahval/ShouchalayReport';
import MalmattaDurusti from '../pages/dashboard/ahval/MalmattaDurusti';
import Namuna8 from '../pages/dashboard/ahval/Namuna8';
import Namuna9 from '../pages/dashboard/ahval/Namuna9';
import Bill from '../pages/dashboard/ahval/Bill';
import BillWard from '../pages/dashboard/ahval/BillWard';
import Namuna10 from '../pages/dashboard/ahval/Namuna10';
import ImlaKar from '../pages/dashboard/ahval/ImlaKar';
import Loaders from '../pages/dashboard/loaders/Loaders';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const createRouter = (handleLogout: () => void) =>
  createBrowserRouter([
    {
      path: '/',
      element: <PublicLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'about', element: <About /> },
        { path: 'contact', element: <Contact /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: 'forgot-password', element: <ForgotPassword /> },
        { path: 'reset-password', element: <ResetPassword /> },
      ],
    },
    {
      path: '/nodni-form',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <NodniForm /> },
      ],
    },
    {
      path: '/malmatta-nodni',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MalmattaNodni /> },
      ],
    },
    {
      path: '/malmatta-ferfar',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MalmattaFerfar /> },
        { path: 'ferfar-form', element: <FerfarForm /> },
        { path: 'pdf-management', element: <FerfarPdfManagement /> },
      ],
    },
    {
      path: '/kar-aakarani',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <KarAakarani /> },
      ],
    },
    {
      path: '/vasuli',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Vasuli /> },
        { path: 'vasuli-form', element: <VasuliForm /> },
      ],
    },
    {
      path: '/view-vasuli',
      element: (
        <ProtectedRoute>
          <ViewVasuli />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-aadhar-report',
      element: (
        <ProtectedRoute>
          <AadharReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-mobile-report',
      element: (
        <ProtectedRoute>
          <MobileReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-pani-report',
      element: (
        <ProtectedRoute>
          <PaniReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-shouchalay-report',
      element: (
        <ProtectedRoute>
          <ShouchalayReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/ahval',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Ahval /> },
        { path: 'aadhar-list', element: <AadharList /> },
        { path: 'mobile-list', element: <MobileList /> },
        { path: 'pani-list', element: <PaniList /> },
        { path: 'shouchalay-list', element: <ShouchalayList /> },
        { path: 'malmatta-durusti', element: <MalmattaDurusti /> },
        { path: 'namuna8', element: <Namuna8 /> },
        { path: 'namuna9', element: <Namuna9 /> },
        { path: 'bill', element: <Bill /> },
        { path: 'bill-ward', element: <BillWard /> },
        { path: 'namuna10', element: <Vasuli /> },
        { path: 'imla-kar', element: <ImlaKar /> },
      ],
    },
    {
      path: '/loaders',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Loaders /> },
      ],
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'category/:categoryId', element: <CategoryDetail /> },
      ],
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Profile /> },
      ],
    },
    {
      path: '/change-password',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <ChangePassword /> },
      ],
    },
    {
      path: '/components',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Components /> },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
