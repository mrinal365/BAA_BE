import { findUserByEmail, createUser } from './auth.repository.js';
import { createAppError } from '../../utils/appError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signup = async (signupData) => {
  const { email, password, role } = signupData;

  // 1. Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw createAppError('Email is already registered', 409);
  }

  // 2. Hash password using bcryptjs
  const passwordHash = await bcrypt.hash(password, 10);

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

  // Compare password using bcryptjs
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
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
