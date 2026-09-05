import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db, UserRecord } from './db';
import { User } from '../src/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function sanitizeUser(user: UserRecord): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or invalid authorization token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Bearer token is empty.',
    });
    return;
  }

  const userRecord = db.getUserByToken(token);
  if (!userRecord) {
    res.status(401).json({
      error: 'Unauthorized: Session expired or invalid credentials. Please log in again.',
    });
    return;
  }

  req.user = sanitizeUser(userRecord);
  req.token = token;
  next();
}
