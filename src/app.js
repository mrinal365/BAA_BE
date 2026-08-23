import express from 'express';
import dotenv from 'dotenv';

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

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    data: {},
    error: message,
  });
});

export default app;
