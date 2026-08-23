import { findUserByEmail, createUser } from './auth.repository.js';
import { createAppError } from '../../utils/appError.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Secure SHA-256 password hashing helper
export const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const signup = async (signupData) => {
  const { email, password, role } = signupData;

  // 1. Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw createAppError('Email is already registered', 409);
  }

  // 2. Hash password
  const passwordHash = hashPassword(password);

  // 3. Create user in database
  return await createUser({
    email,
    passwordHash,
    role,
  });
};

export const login = async (loginData) => {
  const { email, password } = loginData;
  
  // Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    throw createAppError('Invalid email or password', 401);
  }

  // Compare password hash
  const incomingHash = hashPassword(password);
  if (user.password_hash !== incomingHash) {
    throw createAppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  const token = jwt.sign(
    { id: user.id, role: user.role },
    jwtSecret,
    { expiresIn: '1d' }
  );

  // Exclude password hash from returned user object
  const userResponse = { ...user };
  delete userResponse.password_hash;

  return {
    token,
    user: userResponse,
  };
};
