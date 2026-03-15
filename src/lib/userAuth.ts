import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET || 'fallback_secret_32chars_minimum!!';

export interface UserPayload { id: string; email: string; type: 'user'; }

export function signUserToken(p: UserPayload): string {
  return jwt.sign(p, SECRET, { expiresIn: '30d' });
}
export function verifyUserToken(token: string): UserPayload | null {
  try {
    const p = jwt.verify(token, SECRET) as UserPayload;
    return p.type === 'user' ? p : null;
  } catch { return null; }
}
export function getUser(req: NextRequest): UserPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyUserToken(auth.substring(7));
}
