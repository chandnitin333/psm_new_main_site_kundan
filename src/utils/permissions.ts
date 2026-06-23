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
  | 'report' | 'print' | 'pdf' | 'image_upload' | 'magil_kar';

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

// super_user always has full access; otherwise no explicit permissions at all
// -> full access (migration / safety)
export const isFullAccess = (): boolean => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
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

// Where to land after login: dashboard if allowed, otherwise the first
// permitted page (in PATH_TO_MODULE order). Full-access users always get dashboard.
export const getLandingPath = (): string => {
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
  if (isFullAccess()) return items;
  const result: T[] = [];
  for (const item of items) {
    const subs = item.subMenus || [];
    if (subs.length > 0) {
      const visibleSubs = subs.filter((s) => {
        const m = moduleForPath(s.path);
        return m ? canModule(m) : true;
      });
      if (visibleSubs.length > 0) result.push({ ...item, subMenus: visibleSubs });
    } else if (item.path === '/certificates') {
      // certificates menu shows if the user can access ANY certificate type
      if (canAnyCertificate()) result.push(item);
    } else {
      const m = item.path ? moduleForPath(item.path) : undefined;
      if (!m || canModule(m)) result.push(item);
    }
  }
  return result;
};
