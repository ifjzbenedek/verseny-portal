export interface DecodedJwt {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [k: string]: unknown;
}

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return false;
  return decoded.exp * 1000 < Date.now();
}
