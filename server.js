/* eslint-env node */

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import lacrmRoutes from './src/server/lacrmRoutes.js';
import { buildAuthRouter, requireAuth, SESSION_COOKIE_NAME } from './src/server/auth.js';
import { createSessionStore } from './src/server/sessionStore.js';

// Get directory path for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const distPath = path.join(__dirname, 'dist');
const distIndexPath = path.join(distPath, 'index.html');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const cookieSameSite = process.env.SESSION_COOKIE_SAME_SITE || (isProduction ? 'strict' : 'lax');
const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
const sessionMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 12);
const trustProxy = process.env.TRUST_PROXY ?? (isProduction ? '1' : '0');
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && !sessionSecret) {
  throw new Error('SESSION_SECRET must be set in production');
}

if (isProduction && String(sessionSecret || '').length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production');
}

if (isProduction && !process.env.AUTH_PASSWORD_HASH) {
  throw new Error('AUTH_PASSWORD_HASH must be set in production');
}

if (isProduction && process.env.AUTH_PASSWORD) {
  throw new Error('AUTH_PASSWORD is not allowed in production. Use AUTH_PASSWORD_HASH only.');
}

if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
  throw new Error('SESSION_COOKIE_SAME_SITE must be one of: lax, strict, none');
}

if (!Number.isFinite(sessionMaxAgeMs) || sessionMaxAgeMs <= 0) {
  throw new Error('SESSION_MAX_AGE_MS must be a positive number');
}

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', trustProxy === '0' ? false : Number(trustProxy) || 1);
app.use(helmet({
  contentSecurityPolicy: false,
}));

if (allowedOrigins.length > 0) {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }));
}

app.use(express.json({ limit: '100kb' }));

const bootstrap = async () => {
  if (isProduction && !existsSync(distIndexPath)) {
    throw new Error('dist/index.html not found. Build the frontend before starting production server.');
  }

  const { store, backend, redisClient } = await createSessionStore({ isProduction });

  const sessionConfig = {
    name: SESSION_COOKIE_NAME,
    secret: sessionSecret || 'dev-only-session-secret',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: cookieSameSite,
      maxAge: sessionMaxAgeMs,
    },
  };

  if (cookieDomain) {
    sessionConfig.cookie.domain = cookieDomain;
  }

  if (store) {
    sessionConfig.store = store;
  }

  app.use(session(sessionConfig));

  // Routes
  app.use('/api/auth', buildAuthRouter());
  app.use('/api', requireAuth, lacrmRoutes);

  // Health check
  app.get('/health', async (req, res) => {
    const health = {
      status: 'ok',
      sessionBackend: backend,
      redis: {
        enabled: backend === 'redis',
        connected: false,
      },
    };

    if (backend === 'redis' && redisClient) {
      health.redis.connected = redisClient.isOpen;

      try {
        await redisClient.ping();
      } catch (error) {
        health.status = 'degraded';
        health.redis.connected = false;
        health.redis.error = error.message;
      }
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  if (isProduction) {
    app.use(express.static(distPath, {
      index: false,
      etag: true,
      maxAge: '1h',
    }));

    app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (req, res) => {
      return res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, () => {
    console.log(`LACRM API Proxy server running on http://localhost:${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
