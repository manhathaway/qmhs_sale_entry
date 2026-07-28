/* eslint-env node */

import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

export const createSessionStore = async ({ isProduction }) => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        if (isProduction) {
            throw new Error('REDIS_URL must be set in production');
        }

        console.warn('REDIS_URL not set. Using in-memory session store for local development.');
        return {
            store: null,
            backend: 'memory',
            redisClient: null,
        };
    }

    const redisClient = createClient({
        url: redisUrl,
    });

    redisClient.on('error', (error) => {
        console.error('Redis session client error:', error);
    });

    await redisClient.connect();

    return {
        store: new RedisStore({
            client: redisClient,
            prefix: 'qmhs:sess:',
        }),
        backend: 'redis',
        redisClient,
    };
};
