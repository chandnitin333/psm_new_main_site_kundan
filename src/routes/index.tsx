import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { canModule, getLandingPath } from '../utils/permissions';
import { isSuperUser, getActiveGp } from '../utils/activeGp';
import SelectGramPanchayat from '../pages/dashboard/SelectGramPanchayat';
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../pages/dashboard/DashboardLayout';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import Login from '../pages/public/Login';
import Partners from '../pages/public/Partners';
import LegalPage from '../pages/public/LegalPage';
import PublicReportViewer from '../pages/public/PublicReportViewer';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import NotFound from '../pages/NotFound';

// Dashboard Pages
import Dashboard from '../pages/dashboard/Dashboard';
import CategoryDetail from '../pages/dashboard/CategoryDetail';
import ChaluKhatedar from '../pages/dashboard/ChaluKhatedar';
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
import Namuna8Print from '../pages/dashboard/malmatta-nodni/Namuna8Print';
import Namuna8SarkariPrint from '../pages/dashboard/malmatta-nodni/Namuna8SarkariPrint';
import Namuna8NewPrint from '../pages/dashboard/malmatta-nodni/Namuna8NewPrint';
import Namuna8ImagesPrint from '../pages/dashboard/malmatta-nodni/Namuna8ImagesPrint';
import Namuna9Print from '../pages/dashboard/malmatta-nodni/Namuna9Print';
import Ahval from '../pages/dashboard/ahval/Ahval';
import Certificates from '../pages/dashboard/certificates/Certificates';
import CertificatePage from '../pages/dashboard/certificates/CertificatePage';
import AadharList from '../pages/dashboard/ahval/AadharList';
import AadharReport from '../pages/dashboard/ahval/AadharReport';
import MobileList from '../pages/dashboard/ahval/MobileList';
import MobileReport from '../pages/dashboard/ahval/MobileReport';
import PaniList from '../pages/dashboard/ahval/PaniList';
import PaniReport from '../pages/dashboard/ahval/PaniReport';
import ShouchalayList from '../pages/dashboard/ahval/ShouchalayList';
import ShouchalayReport from '../pages/dashboard/ahval/ShouchalayReport';
import MalmattaDurusti from '../pages/dashboard/ahval/MalmattaDurusti';
import MalmattaDharkachiReport from '../pages/dashboard/ahval/MalmattaDharkachiReport';
import Namuna8AnukramikaReport from '../pages/dashboard/ahval/Namuna8AnukramikaReport';
import Namuna8NewMultiReport from '../pages/dashboard/ahval/Namuna8NewMultiReport';
import Namuna8ImagesMultiReport from '../pages/dashboard/ahval/Namuna8ImagesMultiReport';
import Namuna8MultiReport from '../pages/dashboard/ahval/Namuna8MultiReport';
import Namuna8GhosvaraReport from '../pages/dashboard/ahval/Namuna8GhosvaraReport';
import Namuna8SarkariMultiReport from '../pages/dashboard/ahval/Namuna8SarkariMultiReport';
import Namuna9AnukramikaReport from '../pages/dashboard/ahval/Namuna9AnukramikaReport';
import Namuna9MultiReport from '../pages/dashboard/ahval/Namuna9MultiReport';
import Namuna9NewMultiReport from '../pages/dashboard/ahval/Namuna9NewMultiReport';
import Namuna9GhosvaraReport from '../pages/dashboard/ahval/Namuna9GhosvaraReport';
import Bill129_1Report from '../pages/dashboard/ahval/Bill129_1Report';
import Bill129_2Report from '../pages/dashboard/ahval/Bill129_2Report';
import ImlaKarReport from '../pages/dashboard/ahval/ImlaKarReport';
import ImlaKarAnukramikaReport from '../pages/dashboard/ahval/ImlaKarAnukramikaReport';
import Namuna8 from '../pages/dashboard/ahval/Namuna8';
import Namuna9 from '../pages/dashboard/ahval/Namuna9';
import BillWard from '../pages/dashboard/ahval/BillWard';
import ImlaKar from '../pages/dashboard/ahval/ImlaKar';
import Loaders from '../pages/dashboard/loaders/Loaders';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // super_user must pick a gram panchayat before using any page
  if (isSuperUser() && !getActiveGp() && location.pathname !== '/select-gp') {
    return <Navigate to="/select-gp" replace />;
  }
  return <>{children}</>;
};

// Guest-only routes (home + auth pages). A logged-in user who lands here — via
// the root URL or by typing the URL directly — is sent to their landing page
// (dashboard if permitted, otherwise the first page they have access to).
const GuestRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Navigate to={getLandingPath()} replace /> : <>{children}</>;
};

// Dashboard home: only for users with dashboard permission; others are sent to
// their first permitted page (prevents opening /dashboard directly without access).
const DashboardHome = () => {
  return canModule('dashboard') ? <Dashboard /> : <Navigate to={getLandingPath()} replace />;
};

export const createRouter = (handleLogout: () => void) =>
  createBrowserRouter([
    {
      path: '/',
      element: <PublicLayout />,
      children: [
        { index: true, element: <GuestRoute><Home /></GuestRoute> },
        { path: 'about', element: <About /> },
        { path: 'contact', element: <Contact /> },
        { path: 'partners', element: <Partners /> },
        { path: 'terms', element: <LegalPage pageKey="terms" fallbackTitle="Terms of Service" /> },
        { path: 'privacy', element: <LegalPage pageKey="privacy" fallbackTitle="Privacy Policy" /> },
        { path: 'disclaimer', element: <LegalPage pageKey="disclaimer" fallbackTitle="Disclaimer" /> },
        { path: 'login', element: <GuestRoute><Login /></GuestRoute> },
        { path: 'register', element: <GuestRoute><Register /></GuestRoute> },
        { path: 'forgot-password', element: <GuestRoute><ForgotPassword /></GuestRoute> },
        { path: 'reset-password', element: <GuestRoute><ResetPassword /></GuestRoute> },
      ],
    },
    {
      // PUBLIC scanned-QR report viewer (no login, no layout)
      path: '/r/:token',
      element: <PublicReportViewer />,
    },
    {
      // super_user: pick the gram panchayat to work in (standalone, no dashboard layout)
      path: '/select-gp',
      element: (
        <ProtectedRoute>
          <SelectGramPanchayat />
        </ProtectedRoute>
      ),
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
      path: '/namuna-8-1',
      element: (
        <ProtectedRoute>
          <Namuna8Print />
        </ProtectedRoute>
      ),
    },
    {
      path: '/namuna-8-sarkari-1',
      element: (
        <ProtectedRoute>
          <Namuna8SarkariPrint />
        </ProtectedRoute>
      ),
    },
    {
      path: '/namuna-8-new-1',
      element: (
        <ProtectedRoute>
          <Namuna8NewPrint />
        </ProtectedRoute>
      ),
    },
    {
      path: '/namuna-8-images-1',
      element: (
        <ProtectedRoute>
          <Namuna8ImagesPrint />
        </ProtectedRoute>
      ),
    },
    {
      path: '/namuna-9-1',
      element: (
        <ProtectedRoute>
          <Namuna9Print />
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
      path: '/view-dharkachi-yadi',
      element: (
        <ProtectedRoute>
          <MalmattaDharkachiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna8-anukramika',
      element: (
        <ProtectedRoute>
          <Namuna8AnukramikaReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna8-new-multi',
      element: (
        <ProtectedRoute>
          <Namuna8NewMultiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna8-images-multi',
      element: (
        <ProtectedRoute>
          <Namuna8ImagesMultiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna8-multi',
      element: (
        <ProtectedRoute>
          <Namuna8MultiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna8-ghosvara',
      element: (
        <ProtectedRoute>
          <Namuna8GhosvaraReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna8-sarkari-multi',
      element: (
        <ProtectedRoute>
          <Namuna8SarkariMultiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-anukramika',
      element: (
        <ProtectedRoute>
          <Namuna9AnukramikaReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-multi',
      element: (
        <ProtectedRoute>
          <Namuna9MultiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-new-multi',
      element: (
        <ProtectedRoute>
          <Namuna9NewMultiReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-ghosvara',
      element: (
        <ProtectedRoute>
          <Namuna9GhosvaraReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-bill-129-1',
      element: (
        <ProtectedRoute>
          <Bill129_1Report />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-bill-129-2',
      element: (
        <ProtectedRoute>
          <Bill129_2Report />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-imlakar',
      element: (
        <ProtectedRoute>
          <ImlaKarReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-imlakar-anukramika',
      element: (
        <ProtectedRoute>
          <ImlaKarAnukramikaReport />
        </ProtectedRoute>
      ),
    },
    {
      path: '/certificates',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Certificates /> },
        { path: ':slug', element: <CertificatePage /> },
      ],
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
        { index: true, element: <DashboardHome /> },
        { path: 'chalu-khatedar', element: <ChaluKhatedar /> },
        { path: 'adhikrut', element: <ChaluKhatedar title="अधिकृत" prakar="adhikrut" /> },
        { path: 'indira-awas', element: <ChaluKhatedar title="इंदिरा आवास" prakar="gharkul" /> },
        { path: 'imlakar', element: <ChaluKhatedar title="इमलाकर" prakar="imlakar" /> },
        { path: 'ghar-kar', element: <ChaluKhatedar title="घर कर" prakar="gharkar" /> },
        { path: 'audogyik', element: <ChaluKhatedar title="औद्योगिक" prakar="audogyik" /> },
        { path: 'manora', element: <ChaluKhatedar title="मनोरा" prakar="manora" /> },
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
      // When maintenance is OFF, the leftover /maintenance URL (set during
      // maintenance) should send the user to home — not 404.
      path: '/maintenance',
      element: <Navigate to="/" replace />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
