/**
 * Express application assembly.
 *
 * This file wires middleware and routes together — nothing else. Keeping it
 * separate from server.js means the app can later be imported without
 * starting a listener (useful for testing and for keeping boot logic clean).
 *
 * MIDDLEWARE ORDER MATTERS and is deliberate:
 *   1. helmet     — set security headers before anything else runs
 *   2. cors       — reject foreign origins early, allow credentials for the
 *                   refresh-token cookie (M2)
 *   3. parsers    — JSON body with a size cap (large bodies are a DoS vector)
 *   4. rate limit — applied to /api as a whole
 *   5. routes     — feature modules mount here as milestones add them
 *   6. 404        — anything that fell through every route
 *   7. errors     — LAST, so it catches failures from all of the above
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import env from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import ApiResponse from './utils/ApiResponse.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl, // exact origin, not '*' — required for cookies
    credentials: true, // allow the httpOnly refresh-token cookie (M2)
  })
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

/**
 * GET /api/health — liveness check.
 * Response: 200 { success, message, data: { uptime, environment, database } }
 * Used by humans during setup and later by any uptime monitor. Reports the
 * Mongoose connection state so a dead DB is visible without reading logs.
 */
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json(
    new ApiResponse('OK', {
      uptime: `${Math.floor(process.uptime())}s`,
      environment: env.nodeEnv,
      database: dbStates[mongoose.connection.readyState] ?? 'unknown',
    })
  );
});

// Feature modules (auth, employees, clients, ...) mount here from M2 onward.

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
