/* eslint-env node */

import crypto from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

const SESSION_COOKIE_NAME = 'qmhs.sid';
const isProduction = process.env.NODE_ENV === 'production';

const timingSafeEqual = (a, b) => {
    const aBuffer = Buffer.from(String(a));
    const bBuffer = Buffer.from(String(b));

    if (aBuffer.length !== bBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const verifyPassword = async (password) => {
    const passwordHash = process.env.AUTH_PASSWORD_HASH;
    const fallbackPassword = process.env.AUTH_PASSWORD;

    if (passwordHash) {
        return bcrypt.compare(password, passwordHash);
    }

    if (isProduction) {
        return false;
    }

    if (fallbackPassword) {
        return timingSafeEqual(password, fallbackPassword);
    }

    return false;
};

export const requireAuth = (req, res, next) => {
    if (req.session?.authenticated) {
        return next();
    }

    return res.status(401).json({
        error: 'Unauthorized',
    });
};

export const buildAuthRouter = () => {
    const router = express.Router();

    router.use((req, res, next) => {
        // Avoid caching auth responses in browsers/proxies.
        res.setHeader('Cache-Control', 'no-store');
        next();
    });

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: 'Too many login attempts. Please try again later.',
        },
    });

    router.get('/me', (req, res) => {
        const isAuthenticated = !!req.session?.authenticated;

        if (!isAuthenticated) {
            return res.json({ authenticated: false });
        }

        return res.json({
            authenticated: true,
            user: req.session.user,
        });
    });

    router.post('/login', loginLimiter, async (req, res) => {
        try {
            const expectedUsername = process.env.AUTH_USERNAME;
            const passwordHash = process.env.AUTH_PASSWORD_HASH;
            const fallbackPassword = process.env.AUTH_PASSWORD;

            if (!expectedUsername) {
                return res.status(500).json({
                    error: 'AUTH_USERNAME is not configured on the server',
                });
            }

            if (!passwordHash && !fallbackPassword) {
                return res.status(500).json({
                    error: 'AUTH_PASSWORD_HASH (or AUTH_PASSWORD for dev) is not configured on the server',
                });
            }

            if (isProduction && !passwordHash) {
                return res.status(500).json({
                    error: 'AUTH_PASSWORD_HASH is required in production',
                });
            }

            const { username, password } = req.body || {};

            if (typeof username !== 'string' || typeof password !== 'string') {
                return res.status(400).json({
                    error: 'username and password are required',
                });
            }

            const normalizedUsername = username.trim();
            const usernameIsValid = timingSafeEqual(normalizedUsername, expectedUsername);
            const passwordIsValid = usernameIsValid ? await verifyPassword(password) : false;

            if (!usernameIsValid || !passwordIsValid) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                });
            }

            return req.session.regenerate((regenError) => {
                if (regenError) {
                    console.error('Session regenerate error:', regenError);
                    return res.status(500).json({
                        error: 'Failed to create authenticated session',
                    });
                }

                req.session.authenticated = true;
                req.session.user = {
                    username: expectedUsername,
                    authenticatedAt: new Date().toISOString(),
                };

                return res.json({
                    authenticated: true,
                    user: req.session.user,
                });
            });
        } catch (error) {
            console.error('Auth login error:', error);
            return res.status(500).json({
                error: 'Failed to process login',
            });
        }
    });

    router.post('/logout', (req, res) => {
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: process.env.SESSION_COOKIE_SAME_SITE || (isProduction ? 'strict' : 'lax'),
        };

        if (process.env.SESSION_COOKIE_DOMAIN) {
            cookieOptions.domain = process.env.SESSION_COOKIE_DOMAIN;
        }

        req.session.destroy(() => {
            res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
            res.json({ success: true });
        });
    });

    return router;
};

export { SESSION_COOKIE_NAME };
