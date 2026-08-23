import { findUserByEmail, createUser } from './auth.repository.js';
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
    throw new Error('Email is already registered');
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
    throw new Error('Invalid email or password');
  }

  // Compare password hash
  const incomingHash = hashPassword(password);
  if (user.password_hash !== incomingHash) {
    throw new Error('Invalid email or password');
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
