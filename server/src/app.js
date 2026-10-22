
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();

const isTest = process.env.NODE_ENV === 'test';

const rateLimitWindowMs = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);

const rateLimitMax = Number(
  process.env.RATE_LIMIT_MAX || 300
);

app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
      : 'http://localhost:5173',
  })
);

app.use(express.json({ limit: '1mb' }));

// Keep request logs during development, but reduce test output.
if (!isTest) {
  app.use(morgan('dev'));
}

// Apply API rate limiting.
// Tests can bypass the limiter without changing production behavior.
if (!isTest) {
  app.use(
    '/api',
    rateLimit({
      windowMs: rateLimitWindowMs,
      limit: rateLimitMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        message: 'Too many requests, please try again later.',
      },
    })
  );
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ResolveIT API',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
