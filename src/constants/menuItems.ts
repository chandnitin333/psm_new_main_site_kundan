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
    label: 'Dashboard',
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
    id: 'nodni-form',
    label: 'Nodni Form',
    path: '/nodni-form',
    icon: 'FileText',
    subMenus: []
  },
  {
    id: 'malmatta-nodni',
    label: 'Malmatta Nodni',
    path: '/malmatta-nodni',
    icon: 'Building2',
    subMenus: []
  },
  {
    id: 'malmatta-ferfar',
    label: 'Malmatta Ferfar',
    path: '/malmatta-ferfar',
    icon: 'RefreshCw',
    subMenus: []
  },
  {
    id: 'kar-aakarani',
    label: 'Kar Aakarani',
    path: '/kar-aakarani',
    icon: 'DollarSign',
    subMenus: []
  },
  {
    id: 'vasuli',
    label: 'Vasuli',
    path: '/vasuli',
    icon: 'FileCheck',
    subMenus: []
  },
  {
    id: 'ahval',
    label: 'Ahval',
    path: '/ahval',
    icon: 'BarChart3',
    subMenus: [
      { id: 'ahval-aadhar-list', label: 'Aadhar List Show', path: '/ahval/aadhar-list' },
      { id: 'ahval-mobile-list', label: 'Mobile Number List', path: '/ahval/mobile-list' },
      { id: 'ahval-pani-list', label: 'Pinyache Pani List', path: '/ahval/pani-list' },
      { id: 'ahval-shouchalay-list', label: 'Shouchalay List', path: '/ahval/shouchalay-list' },
      { id: 'ahval-malmatta-durusti', label: 'Malmatta Durusti Yadi', path: '/ahval/malmatta-durusti' },
      { id: 'ahval-namuna8', label: 'Namuna 8', path: '/ahval/namuna8' },
      { id: 'ahval-namuna9', label: 'Namuna 9', path: '/ahval/namuna9' },
      { id: 'ahval-bill-ward', label: 'Karanchya Magniche Bill Ward New', path: '/ahval/bill-ward' },
      { id: 'ahval-namuna10', label: 'Namuna 10', path: '/ahval/namuna10' },
      { id: 'ahval-imla-kar', label: 'Imla Kar', path: '/ahval/imla-kar' }
    ]
  }
];
