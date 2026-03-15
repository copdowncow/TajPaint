import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET || 'fallback_change_me_32chars_minimum';

export interface AdminPayload {
  id: string;
  login: string;
  role: string;
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export function getAdmin(req: NextRequest): AdminPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.substring(7));
}
