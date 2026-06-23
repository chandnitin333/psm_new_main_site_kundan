/**
 * Active Gram Panchayat context for super_user.
 *
 * A super_user belongs to no single gram panchayat — they pick one on the
 * "Select Gram Panchayat" screen and then work inside it without re-selecting.
 * The choice is kept here (localStorage) and:
 *   - sent on every API request as the `X-Active-Gp` header (see services/api.ts),
 *   - merged over the stored user's location so existing currentUser.* reads
 *     (district/taluka/gp/ggp) transparently use the selected GP.
 */

export interface ActiveGp {
  district_id: number;
  taluka_id: number;
  gram_panchayat_id: number;
  gat_gram_panchayat_id: number;
  name: string; // gram panchayat display name (for the banner)
  district_name?: string;
  taluka_name?: string;
  gat_name?: string;
}

const KEY = 'activeGp';

export const getActiveGp = (): ActiveGp | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveGp) : null;
  } catch {
    return null;
  }
};

export const setActiveGp = (gp: ActiveGp): void => {
  localStorage.setItem(KEY, JSON.stringify(gp));
};

export const clearActiveGp = (): void => {
  localStorage.removeItem(KEY);
};

/** Is the logged-in user a super_user? (reads stored user, no API). */
export const isSuperUser = (): boolean => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u?.user_type === 'super_user';
  } catch {
    return false;
  }
};
