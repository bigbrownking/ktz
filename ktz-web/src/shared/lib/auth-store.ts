export interface AuthSession {
  token: string;
  refreshToken: string;
  role: string;
  userId: number | null;
  username: string;
  name: string;
  surname: string;
  photoUrl: string | null;
  age: number;
  locomotiveNumber: string | null;
  locomotiveName: string | null;
}

const KEY = 'ktz_session';
const COOKIE = 'ktz_auth';

export function saveSession(s: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(s));
  localStorage.setItem('ktz_loco_number', s.locomotiveNumber ?? '');
  // Set a cookie so middleware can protect routes server-side
  document.cookie = `${COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
}

export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem('ktz_loco_number');
  // Remove the auth cookie
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
}

export function isAdmin(s: AuthSession | null): boolean {
  return s?.role === 'ROLE_ADMIN';
}

export function isDriver(s: AuthSession | null): boolean {
  return s?.role === 'ROLE_USER';
}
