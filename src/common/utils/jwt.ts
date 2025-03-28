import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

type TokenPayload = {
  userId: string;
  sessionId: string;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
    algorithm: 'HS256',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};