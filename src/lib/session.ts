import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'inventory_session';
const secretKey = process.env.SESSION_SECRET;

if (!secretKey) {
  throw new Error('SESSION_SECRET environment variable is not set');
}

const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: Omit<SessionPayload, 'expiresAt'>): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ ...user, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return decrypt(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function updateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await decrypt(token);
  if (!payload) return;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const newToken = await encrypt({ ...payload, expiresAt });
  cookieStore.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}
