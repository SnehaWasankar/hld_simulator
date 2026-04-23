import { verifyToken } from './jwt';

export function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) return null;

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return null;

  const decoded = verifyToken(token);

  return decoded; // { userId, email }
}