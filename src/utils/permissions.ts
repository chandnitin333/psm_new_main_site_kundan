/**
 * Page-wise permission helpers for the user app.
 *
 * The logged-in user object (localStorage 'user') carries `page_permissions`:
 *   { "<moduleKey>": ["view","edit",...], ... }
 *
 * Rule: if a user has NO permissions stored at all (empty / missing), we treat
 * it as FULL ACCESS — this keeps pre-existing users and any account without an
 * explicit permission set from being locked out. Enforcement only kicks in once
 * the admin has actually assigned something.
 */

export type ActionKey =
  | 'view' | 'add' | 'edit' | 'delete'
  | 'report' | 'print' | 'pdf' | 'image_upload' | 'magil_kar' | 'water_meter' | 'divide'
  | 'scan' | 'gallery' | 'download_template' | 'bulk_import' | 'export';

type PagePermissions = Record<string, ActionKey[]>;

// Route path -> module key (must match admin's permissionModules keys)
export const PATH_TO_MODULE: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/nodni-form': 'nodni_form',
  '/malmatta-nodni': 'malmatta_nodni',
  '/malmatta-ferfar': 'malmatta_ferfar',
  '/kar-aakarani': 'kar_aakarani',
  '/vasuli': 'vasuli',
  '/collection-daybook': 'vasuli_daybook',
  '/collection-mode': 'vasuli_field',
  '/collection-dashboard': 'collection_dashboard',
  '/bulk-reminder': 'bulk_reminder',
  '/water-meter': 'water_meter',
  '/water-meter/field-reading': 'water_field_reading',
  '/ahval/aadhar-list': 'ahval_aadhar_list',
  '/ahval/mobile-list': 'ahval_mobile_list',
  '/ahval/pani-list': 'ahval_pani_list',
  '/ahval/shouchalay-list': 'ahval_shouchalay_list',
  '/ahval/malmatta-durusti': 'ahval_malmatta_durusti',
  '/ahval/namuna8': 'ahval_namuna8',
  '/ahval/namuna9': 'ahval_namuna9',
  '/ahval/bill-ward': 'ahval_bill_ward',
  '/ahval/namuna10': 'ahval_namuna10',
  '/ahval/imla-kar': 'ahval_imla_kar',
  '/ahval/pani-meter-bill': 'ahval_pani_meter_bill',
  '/ahval/ghosvara': 'ahval_ghosvara',
  '/helpline': 'helpline',
  '/posts': 'gp_posts',
  '/grievances': 'grievance',
  '/citizen-notifications': 'citizen_notification',
  // certificates are per-type (module key = `cert_<slug>`); the /certificates menu
  // itself is gated by canAnyCertificate() (see filterMenuItems).
};

// permission module key for a certificate slug
export const certModuleKey = (slug: string) => `cert_${slug}`;

// true if the user can access at least one certificate (or has full access)
export const canAnyCertificate = (): boolean => {
  if (isFullAccess()) return true;
  const pp = getPagePermissions();
  return Object.keys(pp).some((k) => k.startsWith('cert_') && Array.isArray(pp[k]) && pp[k].length > 0);
};

export const getPagePermissions = (): PagePermissions => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const pp = user?.page_permissions;
    return pp && typeof pp === 'object' ? (pp as PagePermissions) : {};
  } catch {
    return {};
  }
};

// Citizen (नागरिक / मालमत्ताधारक) — a villager login created from a nodni record.
// They get a restricted citizen dashboard only, NOT the staff/admin views.
export const isCitizen = (): boolean => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.user_type === 'citizen';
  } catch { return false; }
};

// super_user always has full access; otherwise no explicit permissions at all
// -> full access (migration / safety). Citizens are NEVER full access.
export const isFullAccess = (): boolean => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.user_type === 'citizen') return false;
    if (user?.user_type === 'super_user') return true;
  } catch { /* ignore */ }
  const pp = getPagePermissions();
  return !pp || Object.keys(pp).length === 0;
};

// Can the user open this module/page at all? (has any action OR full access)
export const canModule = (moduleKey: string): boolean => {
  if (isFullAccess()) return true;
  const pp = getPagePermissions();
  return Array.isArray(pp[moduleKey]) && pp[moduleKey].length > 0;
};

// Can the user perform a specific action on a module?
export const can = (moduleKey: string, action: ActionKey): boolean => {
  if (isFullAccess()) return true;
  const pp = getPagePermissions();
  return Array.isArray(pp[moduleKey]) && pp[moduleKey].includes(action);
};

// Module key for a route path (handles trailing segments under /ahval/*)
export const moduleForPath = (path: string): string | undefined => PATH_TO_MODULE[path];

// Some paths need a specific ACTION (not just the module) to be visible.
// (पाणी मीटर व फील्ड रीडिंग are now their own modules — see PATH_TO_MODULE.)
export const PATH_TO_ACTION: Record<string, ActionKey> = {};

// Can the user reach a route (menu-level)? Uses action-level check when the path
// declares one in PATH_TO_ACTION, else module-level canModule.
export const canAccessPath = (path?: string): boolean => {
  if (!path) return true;
  const m = moduleForPath(path);
  if (!m) return true;
  const action = PATH_TO_ACTION[path];
  return action ? can(m, action) : canModule(m);
};

// Where to land after login: dashboard if allowed, otherwise the first
// permitted page (in PATH_TO_MODULE order). Full-access users always get dashboard.
export const getLandingPath = (): string => {
  if (isCitizen()) return '/my-property';
  if (isFullAccess() || canModule('dashboard')) return '/dashboard';
  for (const [path, moduleKey] of Object.entries(PATH_TO_MODULE)) {
    if (path === '/dashboard') continue;
    if (canModule(moduleKey)) return path;
  }
  // No matching permitted page found — fall back to dashboard.
  return '/dashboard';
};

interface MenuLike {
  path?: string;
  subMenus?: { path: string }[];
}

// Filter a menu tree to only the items/submenus the user can access.
// Parent with submenus is kept only if at least one submenu is visible.
export const filterMenuItems = <T extends MenuLike>(items: T[]): T[] => {
  if (isCitizen()) return []; // citizens have no staff menus
  if (isFullAccess()) return items;
  const result: T[] = [];
  for (const item of items) {
    const subs = item.subMenus || [];
    if (subs.length > 0) {
      const visibleSubs = subs.filter((s) => canAccessPath(s.path));
      if (visibleSubs.length > 0) result.push({ ...item, subMenus: visibleSubs });
    } else if (item.path === '/certificates') {
      // certificates menu shows if the user can access ANY certificate type
      if (canAnyCertificate()) result.push(item);
    } else {
      if (canAccessPath(item.path)) result.push(item);
    }
  }
  return result;
};
