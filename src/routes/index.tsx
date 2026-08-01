import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { canModule, getLandingPath, moduleForPath, canAnyCertificate, isCitizen } from '../utils/permissions';
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
import CertificateVerify from '../pages/public/CertificateVerify';
import InstallApp from '../pages/public/InstallApp';
import AppPoster from '../pages/dashboard/AppPoster';
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
import DuplicateMobiles from '../pages/dashboard/malmatta-nodni/DuplicateMobiles';
import PropertyHistory from '../pages/dashboard/malmatta-nodni/PropertyHistory';
import CollectionDaybook from '../pages/dashboard/vasuli/CollectionDaybook';
import CollectionDashboard from '../pages/dashboard/vasuli/CollectionDashboard';
import BulkReminder from '../pages/dashboard/vasuli/BulkReminder';
import PropertyLedger from '../pages/dashboard/vasuli/PropertyLedger';
import MyComplaints from '../pages/dashboard/MyComplaints';
import GrievancesAdmin from '../pages/dashboard/GrievancesAdmin';
import NodniImportLog from '../pages/dashboard/nodni-form/NodniImportLog';
import MyPayments from '../pages/dashboard/MyPayments';
import MyNotifications from '../pages/dashboard/MyNotifications';
import CitizenNotifications from '../pages/dashboard/CitizenNotifications';
import CollectionMode from '../pages/dashboard/vasuli/CollectionMode';
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
import DharkachiYadiCard from '../pages/dashboard/ahval/DharkachiYadiCard';
import GhosvaraCard from '../pages/dashboard/ahval/GhosvaraCard';
import Namuna9Card from '../pages/dashboard/ahval/Namuna9Card';
import Namuna9NewCard from '../pages/dashboard/ahval/Namuna9NewCard';
import Namuna9GhosvaraCard from '../pages/dashboard/ahval/Namuna9GhosvaraCard';
import Bill129Card from '../pages/dashboard/ahval/Bill129Card';
import AnukramikaCard from '../pages/dashboard/ahval/AnukramikaCard';
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
import GhosvaraReport from '../pages/dashboard/ahval/GhosvaraReport';
import PaniMeterBill from '../pages/dashboard/ahval/PaniMeterBill';
import WaterMeterMultiReport from '../pages/dashboard/water-meter/WaterMeterMultiReport';
import Loaders from '../pages/dashboard/loaders/Loaders';
import CitizenDashboard from '../pages/dashboard/CitizenDashboard';
import CitizenProfile from '../pages/dashboard/CitizenProfile';
import CitizenMalmatta from '../pages/dashboard/CitizenMalmatta';
import CitizenBill from '../pages/dashboard/CitizenBill';
import CitizenHelpline from '../pages/dashboard/CitizenHelpline';
import Helpline from '../pages/dashboard/helpline/Helpline';
import CitizenPosts from '../pages/dashboard/CitizenPosts';
import Posts from '../pages/dashboard/posts/Posts';
import WaterMeter from '../pages/dashboard/water-meter/WaterMeter';
import WaterMeterDetail from '../pages/dashboard/water-meter/WaterMeterDetail';
import WaterFieldReading from '../pages/dashboard/water-meter/WaterFieldReading';
import CitizenWaterBill from '../pages/dashboard/CitizenWaterBill';

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

  // permission guard: if this page is not allowed for the user, send them to a
  // page they DO have access to (their landing page).
  const landing = getLandingPath();
  const path = location.pathname;
  if (path.startsWith('/certificates')) {
    if (!canAnyCertificate() && path !== landing) return <Navigate to={landing} replace />;
  } else {
    const mod = moduleForPath(path);
    // citizens may always view their own pages (helpline directory, posts feed)
    const citizenAllowed = isCitizen() && (mod === 'helpline' || mod === 'gp_posts');
    if (mod && !canModule(mod) && !citizenAllowed && path !== landing) return <Navigate to={landing} replace />;
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

// Citizen dashboard home: only citizens see it; any other logged-in user is
// bounced to their own landing page.
const CitizenHome = () => {
  return isCitizen() ? <CitizenDashboard /> : <Navigate to={getLandingPath()} replace />;
};

// /profile: citizens get their own citizen profile; staff get the regular one.
const ProfileHome = () => {
  return isCitizen() ? <CitizenProfile /> : <Profile />;
};

// /my-property: citizen-only view of their own registered property.
const MyPropertyHome = () => {
  return isCitizen() ? <CitizenMalmatta /> : <Navigate to={getLandingPath()} replace />;
};

// /my-bill: citizen-only tax demand bill.
const MyBillHome = () => {
  return isCitizen() ? <CitizenBill /> : <Navigate to={getLandingPath()} replace />;
};

// /my-complaints: citizen-only grievance page (direct, no permission).
const MyComplaintsHome = () => {
  return isCitizen() ? <MyComplaints /> : <Navigate to={getLandingPath()} replace />;
};

// /my-payments: citizen-only payment history + receipt (direct, no permission).
const MyPaymentsHome = () => {
  return isCitizen() ? <MyPayments /> : <Navigate to={getLandingPath()} replace />;
};

// /my-notifications: citizen-only in-app notifications (direct, no permission).
const MyNotificationsHome = () => {
  return isCitizen() ? <MyNotifications /> : <Navigate to={getLandingPath()} replace />;
};

// /helpline: citizens get the read-only directory; staff get the management page.
const HelplineHome = () => {
  return isCitizen() ? <CitizenHelpline /> : <Helpline />;
};

// /posts: citizens get the notices feed; staff get the management page.
const PostsHome = () => {
  return isCitizen() ? <CitizenPosts /> : <Posts />;
};

// Water meter management is staff-only; citizens are bounced to their landing.
const StaffOnly = ({ children }: { children: React.ReactNode }) => {
  return isCitizen() ? <Navigate to={getLandingPath()} replace /> : <>{children}</>;
};

// /water-bill: citizen-only read-only water bill.
const WaterBillHome = () => {
  return isCitizen() ? <CitizenWaterBill /> : <Navigate to={getLandingPath()} replace />;
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
      // PUBLIC certificate authenticity check (scanned from a certificate's QR)
      path: '/verify/:token',
      element: <CertificateVerify />,
    },
    {
      // PUBLIC install landing page — target of the scanned "App QR poster" (no login, no layout)
      path: '/install',
      element: <InstallApp />,
    },
    {
      // Printable QR poster generator for GP staff (standalone, login required)
      path: '/app-poster',
      element: (
        <ProtectedRoute>
          <AppPoster />
        </ProtectedRoute>
      ),
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
      path: '/nodni-import-log',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <NodniImportLog /> },
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
        { path: 'duplicates', element: <DuplicateMobiles /> },
      ],
    },
    {
      path: '/property-history',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <PropertyHistory /> },
      ],
    },
    {
      path: '/collection-daybook',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <CollectionDaybook /> },
      ],
    },
    {
      path: '/collection-dashboard',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <CollectionDashboard /> },
      ],
    },
    {
      path: '/bulk-reminder',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <BulkReminder /> },
      ],
    },
    {
      path: '/property-ledger/:nodniId',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <PropertyLedger /> },
      ],
    },
    {
      path: '/collection-mode',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <CollectionMode /> },
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
      path: '/view-dharkachi-yadi-card',
      element: (
        <ProtectedRoute>
          <DharkachiYadiCard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-ghosvara-card',
      element: (
        <ProtectedRoute>
          <GhosvaraCard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-card',
      element: (
        <ProtectedRoute>
          <Namuna9Card />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-new-card',
      element: (
        <ProtectedRoute>
          <Namuna9NewCard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-namuna9-ghosvara-card',
      element: (
        <ProtectedRoute>
          <Namuna9GhosvaraCard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-bill-129-card',
      element: (
        <ProtectedRoute>
          <Bill129Card />
        </ProtectedRoute>
      ),
    },
    {
      path: '/view-anukramika-card',
      element: (
        <ProtectedRoute>
          <AnukramikaCard />
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
      path: '/water-meter-report',
      element: (
        <ProtectedRoute>
          <WaterMeterMultiReport />
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
        { path: 'pani-meter-bill', element: <PaniMeterBill /> },
        { path: 'ghosvara', element: <GhosvaraReport /> },
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
      path: '/citizen-dashboard',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <CitizenHome /> },
      ],
    },
    {
      path: '/my-property',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MyPropertyHome /> },
      ],
    },
    {
      path: '/my-bill',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MyBillHome /> },
      ],
    },
    {
      path: '/my-complaints',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MyComplaintsHome /> },
      ],
    },
    {
      path: '/my-payments',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MyPaymentsHome /> },
      ],
    },
    {
      path: '/my-notifications',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <MyNotificationsHome /> },
      ],
    },
    {
      path: '/citizen-notifications',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <CitizenNotifications /> },
      ],
    },
    {
      path: '/grievances',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <GrievancesAdmin /> },
      ],
    },
    {
      path: '/helpline',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <HelplineHome /> },
      ],
    },
    {
      path: '/posts',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <PostsHome /> },
      ],
    },
    {
      path: '/water-meter',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <StaffOnly><WaterMeter /></StaffOnly> },
        { path: 'field-reading', element: <StaffOnly><WaterFieldReading /></StaffOnly> },
        { path: ':id', element: <StaffOnly><WaterMeterDetail /></StaffOnly> },
      ],
    },
    {
      path: '/water-bill',
      element: (
        <ProtectedRoute>
          <DashboardLayout onLogout={handleLogout} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <WaterBillHome /> },
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
        { index: true, element: <ProfileHome /> },
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
