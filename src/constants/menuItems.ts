import type { MenuItem } from '../interfaces';
// import { FileText, Home, Building2, RefreshCw, DollarSign, FileCheck, BarChart3, Boxes } from 'lucide-react';

export const PUBLIC_MENU_ITEMS: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    subMenus: []
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    subMenus: []
  },
  {
    id: 'contact',
    label: 'Contact Us',
    path: '/contact',
    subMenus: []
  },
  {
    id: 'login',
    label: 'Login',
    path: '/login',
    subMenus: []
  }
];

export const DASHBOARD_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'डॅशबोर्ड',
    path: '/dashboard',
    icon: 'Home',
    subMenus: []
  },
  // {
  //   id: 'loaders',
  //   label: 'Loaders',
  //   path: '/loaders',
  //   icon: 'Loader2',
  //   subMenus: []
  // },
  {
    id: 'nodni',
    label: 'नोंदणी',
    path: '/nodni-form',
    icon: 'FileText',
    subMenus: [
      { id: 'nodni-form', label: 'नोंदणी फॉर्म', path: '/nodni-form' },
      { id: 'malmatta-nodni', label: 'मालमत्ता नोंदणी', path: '/malmatta-nodni' },
      { id: 'malmatta-ferfar', label: 'मालमत्ता फेरफार', path: '/malmatta-ferfar' },
    ]
  },
  {
    id: 'kar-aakarani',
    label: 'कर आकारणी',
    path: '/kar-aakarani',
    icon: 'DollarSign',
    subMenus: []
  },
  {
    id: 'vasuli',
    label: 'वसुली',
    path: '/vasuli',
    icon: 'FileCheck',
    subMenus: []
  },
  {
    id: 'ahval',
    label: 'अहवाल',
    path: '/ahval',
    icon: 'BarChart3',
    subMenus: [
      { id: 'ahval-aadhar-list', label: 'आधार यादी', path: '/ahval/aadhar-list' },
      { id: 'ahval-mobile-list', label: 'मोबाईल क्रमांक यादी', path: '/ahval/mobile-list' },
      { id: 'ahval-pani-list', label: 'पिण्याचे पाणी यादी', path: '/ahval/pani-list' },
      { id: 'ahval-shouchalay-list', label: 'शौचालय यादी', path: '/ahval/shouchalay-list' },
      { id: 'ahval-malmatta-durusti', label: 'मालमत्ता दुरुस्ती यादी', path: '/ahval/malmatta-durusti' },
      { id: 'ahval-namuna8', label: 'नमुना ८', path: '/ahval/namuna8' },
      { id: 'ahval-namuna9', label: 'नमुना ९', path: '/ahval/namuna9' },
      { id: 'ahval-bill-ward', label: 'करांच्या मागणीचे बिल (प्रभाग)', path: '/ahval/bill-ward' },
      { id: 'ahval-namuna10', label: 'नमुना १०', path: '/ahval/namuna10' },
      { id: 'ahval-imla-kar', label: 'इमला कर', path: '/ahval/imla-kar' }
    ]
  },
  {
    id: 'certificates',
    label: 'प्रमाणपत्रे',
    path: '/certificates',
    icon: 'Award',
    subMenus: []
  }
];
