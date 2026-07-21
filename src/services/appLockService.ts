/**
 * App Lock (MPIN/WPIN) — 4-digit PIN + optional biometric screen lock.
 */
import { api, type ApiResponse } from './api';

export interface LockSettings {
  is_enabled: boolean;
  is_default_pin: boolean;
  biometric_enabled: boolean;
  auto_lock_minutes: number;
  has_credential: boolean;
}

const E = {
  GET: '/main/app-lock',
  VERIFY: '/main/app-lock/verify',
  PIN: '/main/app-lock/pin',
  TOGGLE: '/main/app-lock/toggle',
  TIMEOUT: '/main/app-lock/timeout',
  BIOMETRIC: '/main/app-lock/biometric',
} as const;

export const appLockService = {
  getSettings: async (): Promise<ApiResponse<LockSettings>> => api.get(E.GET),
  verify: async (pin: string): Promise<ApiResponse<{ ok: boolean }>> => api.post(E.VERIFY, { pin }),
  changePin: async (current_pin: string, new_pin: string): Promise<ApiResponse> =>
    api.put(E.PIN, { current_pin, new_pin }),
  toggle: async (is_enabled: boolean): Promise<ApiResponse> => api.put(E.TOGGLE, { is_enabled }),
  setTimeoutMinutes: async (auto_lock_minutes: number): Promise<ApiResponse> => api.put(E.TIMEOUT, { auto_lock_minutes }),
  setBiometric: async (biometric_enabled: boolean, credential_id?: string): Promise<ApiResponse> =>
    api.put(E.BIOMETRIC, { biometric_enabled, credential_id }),
};

export default appLockService;
