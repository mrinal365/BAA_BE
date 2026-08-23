import { z } from 'zod';
import { USER_ROLES } from '../../enums/user.js';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(Object.values(USER_ROLES)).default(USER_ROLES.CLIENT),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
