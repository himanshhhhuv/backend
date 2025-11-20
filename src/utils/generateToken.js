import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn, ...options });

export const signRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn, ...options });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

