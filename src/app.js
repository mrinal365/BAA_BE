import express from 'express';
import dotenv from 'dotenv';
import { ZodError } from 'zod';
import authRoutes from './modules/auth/auth.routes.js';
import bookingRoutes from './modules/booking/booking.routes.js';
import artistRoutes from './modules/artist/artist.routes.js';

dotenv.config();

const app = express();

app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date(),
    },
    error: null,
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/artists', artistRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Format Zod schema validation errors to consistent shape
  if (err instanceof ZodError) {
    const issues = err.issues || err.errors || [];
    const errorMsg = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      data: {},
      error: errorMsg,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  return res.status(statusCode).json({
    success: false,
    data: {},
    error: message,
  });
});

export default app;
