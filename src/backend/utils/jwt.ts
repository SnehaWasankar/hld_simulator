import jwt from 'jsonwebtoken';
import { JwtUser } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'; 

export function generateToken(payload: JwtUser) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtUser;
  } catch (err) {
    return null;
  }
}