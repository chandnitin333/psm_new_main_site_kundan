import { describe, it, expect, beforeEach } from 'vitest';
import { can, canModule, isFullAccess, isCitizen } from '../permissions';

const setUser = (u: unknown) => localStorage.setItem('user', JSON.stringify(u));

describe('permissions', () => {
  beforeEach(() => localStorage.clear());

  it('gated staff user sees only granted module/action', () => {
    setUser({ user_type: 'user', page_permissions: { vasuli: ['view'] } });
    expect(canModule('vasuli')).toBe(true);
    expect(can('vasuli', 'view')).toBe(true);
    expect(can('vasuli', 'add')).toBe(false);
    expect(canModule('nodni_form')).toBe(false);
    expect(isFullAccess()).toBe(false);
  });

  it('super_user has full access to everything', () => {
    setUser({ user_type: 'super_user', page_permissions: { vasuli: ['view'] } });
    expect(isFullAccess()).toBe(true);
    expect(can('anything', 'delete')).toBe(true);
    expect(canModule('anything')).toBe(true);
  });

  it('staff user with no page_permissions = full access', () => {
    setUser({ user_type: 'user' });
    expect(isFullAccess()).toBe(true);
    expect(canModule('vasuli')).toBe(true);
  });

  it('citizen is never staff full-access', () => {
    setUser({ user_type: 'citizen', page_permissions: {} });
    expect(isCitizen()).toBe(true);
    expect(isFullAccess()).toBe(false);
  });
});
