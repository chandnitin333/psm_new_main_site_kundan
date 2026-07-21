/**
 * Biometric unlock via WebAuthn platform authenticator (fingerprint / face).
 * Client-trusted: this is a SECONDARY app-lock (the user is already JWT-authed),
 * so we trust a successful platform user-verification instead of doing full
 * server-side assertion verification. The credential id is stored per-device.
 */

const b64urlToBuf = (s: string): ArrayBuffer => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
};

const bufToB64url = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomBytes = (n: number): Uint8Array => {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
};

const CRED_KEY = 'psm_biometric_cred';

export const biometricSupported = (): boolean =>
  typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;

/** Is a platform authenticator (fingerprint/face) actually available on this device? */
export const biometricAvailable = async (): Promise<boolean> => {
  if (!biometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

/** Register a platform credential. Returns the credential id (base64url) or null. */
export const registerBiometric = async (userId: string | number, userName: string): Promise<string | null> => {
  if (!biometricSupported()) return null;
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'PSM', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(String(userId || 'user')),
          name: userName || 'user',
          displayName: userName || 'user',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) return null;
    const id = bufToB64url(cred.rawId);
    localStorage.setItem(CRED_KEY, id);
    return id;
  } catch {
    return null;
  }
};

/** Prompt the platform authenticator to unlock. Returns true on successful user-verification. */
export const biometricUnlock = async (credentialId?: string): Promise<boolean> => {
  if (!biometricSupported()) return false;
  const id = credentialId || localStorage.getItem(CRED_KEY) || '';
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: window.location.hostname,
        timeout: 60000,
        userVerification: 'required',
        ...(id ? { allowCredentials: [{ type: 'public-key', id: b64urlToBuf(id) }] } : {}),
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
};

export const getStoredCredentialId = (): string | null => localStorage.getItem(CRED_KEY);
export const clearStoredCredential = (): void => localStorage.removeItem(CRED_KEY);
