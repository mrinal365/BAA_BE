import jwt from 'jsonwebtoken';
import { createAppError } from '../utils/appError.js';

export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(createAppError('Authentication token required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (error) {
    return next(createAppError('Invalid or expired authentication token', 401));
  }
};
