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
      { id: 'water-meter-list', label: 'पाणी मीटर यादी', path: '/water-meter' },
      { id: 'water-field-reading', label: 'पाणी फील्ड रीडिंग', path: '/water-meter/field-reading' },
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
    subMenus: [
      { id: 'collection-dashboard', label: 'वसुली डॅशबोर्ड', path: '/collection-dashboard' },
      { id: 'vasuli-entry', label: 'वसुली नोंद', path: '/vasuli' },
      { id: 'collection-mode', label: 'फिरती वसुली', path: '/collection-mode' }
    ]
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
      { id: 'ahval-imla-kar', label: 'इमला कर', path: '/ahval/imla-kar' },
      { id: 'ahval-pani-meter-bill', label: 'पाणी मीटर बिल', path: '/ahval/pani-meter-bill' },
      { id: 'ahval-ghosvara', label: 'घोषवारा', path: '/ahval/ghosvara' }
    ]
  },
  {
    id: 'certificates',
    label: 'प्रमाणपत्रे',
    path: '/certificates',
    icon: 'Award',
    subMenus: []
  },
  {
    id: 'citizen-services',
    label: 'नागरिक सेवा',
    path: '/citizen-services',
    icon: 'LifeBuoy',
    subMenus: [
      { id: 'helpline', label: 'हेल्पलाईन', path: '/helpline' },
      { id: 'gp-posts', label: 'सूचना', path: '/posts' },
      { id: 'grievances', label: 'तक्रारी', path: '/grievances' },
      { id: 'citizen-notifications', label: 'नागरिक सूचना', path: '/citizen-notifications' },
      { id: 'bulk-reminder', label: 'थकबाकी स्मरणपत्र', path: '/bulk-reminder' }
    ]
  }
];

// Menu shown ONLY to citizen (नागरिक / मालमत्ताधारक) logins — dashboard + their property.
export const CITIZEN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'citizen-dashboard',
    label: 'डॅशबोर्ड',
    path: '/citizen-dashboard',
    icon: 'Home',
    subMenus: []
  },
  {
    id: 'my-property',
    label: 'माझी मालमत्ता',
    path: '/my-property',
    icon: 'Building2',
    subMenus: []
  },
  {
    id: 'my-bill',
    label: 'कर बिल',
    path: '/my-bill',
    icon: 'FileText',
    subMenus: []
  },
  {
    id: 'my-payments',
    label: 'माझे भरणे',
    path: '/my-payments',
    icon: 'Receipt',
    subMenus: []
  },
  {
    id: 'helpline',
    label: 'हेल्पलाईन',
    path: '/helpline',
    icon: 'LifeBuoy',
    subMenus: []
  },
  {
    id: 'gp-posts',
    label: 'सूचना',
    path: '/posts',
    icon: 'Megaphone',
    subMenus: []
  },
  {
    id: 'my-notifications',
    label: 'माझ्या सूचना',
    path: '/my-notifications',
    icon: 'Bell',
    subMenus: []
  },
  {
    id: 'my-complaints',
    label: 'माझ्या तक्रारी',
    path: '/my-complaints',
    icon: 'MessagesSquare',
    subMenus: []
  },
  {
    id: 'water-bill',
    label: 'पाणी बिल',
    path: '/water-bill',
    icon: 'Droplet',
    subMenus: []
  }
];
