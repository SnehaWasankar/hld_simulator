import { verifyToken } from './jwt';
import { JwtUser } from '../types/auth';

// JWT handler - extracts and verifies user from request
export function getUserFromRequest(req: Request) :JwtUser | null {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) return null;

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return null;

  try {
    return verifyToken(token); // { userId, email }
  } catch {
    return null;
  }
}