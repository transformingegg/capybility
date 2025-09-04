import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET is not set in the environment variables.");
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Token expires in 8 hours
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This can happen if the token is expired or malformed
    console.error("JWT Decryption Error:", error);
    return null;
  }
}

export async function createSession(address: string) {
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // Expires in 8 hours
    const sessionPayload = { address, isAdmin: true };
    const session = await encrypt(sessionPayload);

    // The error indicates cookies() returns a Promise. We must await it.
    const cookieStore = await cookies();
    cookieStore.set('session', session, { 
        expires, 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}

export async function getSession() {
  // The error indicates cookies() returns a Promise. We must await it.
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get('session')?.value;
  
  if (!sessionValue) {
    return null;
  }
  
  return await decrypt(sessionValue);
}

export async function deleteSession() {
    // The error indicates cookies() returns a Promise. We must await it.
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

