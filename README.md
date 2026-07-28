# QMHS Sale Entry + Leads Board

This project includes:
- `Sale Entry` workflow tooling
- `Leads Board` CRM pipeline view
- Server-side proxy for Less Annoying CRM API
- Session-based login protection for web deployment

## Security Model

The API is protected by session auth:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

All CRM proxy calls under `/api/lacrm` require authentication.

## Environment Setup

Copy `.env.example` to `.env`, then set values:

```env
LACRM_API_KEY=...
PORT=5000
SESSION_SECRET=replace_with_a_long_random_secret
REDIS_URL=redis://localhost:6379
AUTH_USERNAME=your_username
AUTH_PASSWORD_HASH=...
```

Generate `AUTH_PASSWORD_HASH`:

```bash
node -e "import bcrypt from 'bcryptjs'; bcrypt.hash('your_password', 12).then(console.log)"
```

Generate a strong random password + hash in one step:

```bash
node -e "import crypto from 'crypto'; import bcrypt from 'bcryptjs'; const p=crypto.randomBytes(24).toString('base64url'); bcrypt.hash(p, 12).then(h => { console.log('PASSWORD=' + p); console.log('AUTH_PASSWORD_HASH=' + h); });"
```

Additional production session settings:

```env
SESSION_COOKIE_SAME_SITE=strict
SESSION_MAX_AGE_MS=43200000
TRUST_PROXY=1
```

## Run Locally

1. Start API server:

```bash
node server.js
```

2. Start frontend:

```bash
npm run dev
```

3. Open the app and sign in with your configured credentials.

## Deployment Notes

- Always use HTTPS in production.
- Set a strong `SESSION_SECRET` (32+ chars).
- Set `REDIS_URL` in production. The server now requires Redis-backed sessions when `NODE_ENV=production`.
- Set `AUTH_PASSWORD_HASH` and do not use plain `AUTH_PASSWORD` in production.
- Keep `LACRM_API_KEY` server-only.
- Rotate credentials and session secrets on a regular schedule.

## Publish Checklist

Use this flow for a single-service deployment (Node server + built frontend):

1. Configure production environment variables:

```env
NODE_ENV=production
PORT=5000
LACRM_API_KEY=...
SESSION_SECRET=...
REDIS_URL=...
AUTH_USERNAME=...
AUTH_PASSWORD_HASH=...
SESSION_COOKIE_SAME_SITE=strict
TRUST_PROXY=1
```

2. Build the frontend bundle:

```bash
npm ci
npm run build
```

3. Start the production server:

```bash
npm run start
```

4. Validate health endpoint:

```bash
curl https://your-domain/health
```

Expected health response includes:
- `status: "ok"`
- `sessionBackend: "redis"`
- `redis.connected: true`

Notes:
- In production, `server.js` now serves `dist/` directly and falls back to `dist/index.html` for SPA routes.
- If `dist/index.html` is missing, startup fails fast to prevent a partial deploy.

## Render Deployment (Recommended)

This project is ready for Render as a single web service:
- Render runs `npm run build` and `npm run start`.
- `server.js` serves both API and frontend (`dist`) on one domain.
- Redis runs as a Render managed service and provides `REDIS_URL`.

Steps:

1. Push this repo to GitHub.
2. In Render, create a Blueprint deploy from repo root (uses `render.yaml`).
3. Fill required secrets when prompted:
	- `LACRM_API_KEY`
	- `SESSION_SECRET`
	- `AUTH_USERNAME`
	- `AUTH_PASSWORD_HASH`
4. Deploy.

After first deploy, verify:

```bash
curl https://your-render-service.onrender.com/health
```

Expected:
- `status: "ok"`
- `sessionBackend: "redis"`
- `redis.connected: true`

Render notes:
- `NODE_ENV=production` is set by the blueprint.
- Keep `SESSION_COOKIE_SAME_SITE=strict` for same-domain frontend/API on Render.
- Set `ALLOWED_ORIGINS` only if you later host frontend on a different domain.

## Netlify (Upload dist)

Yes, you can host the frontend on Netlify, but this app still requires a backend API server for auth and CRM proxy.

Use this setup:

1. Host backend separately (Render/Railway/Fly/etc.) and set backend env vars from the Publish Checklist.
2. On backend, set:

```env
ALLOWED_ORIGINS=https://your-site.netlify.app
SESSION_COOKIE_SAME_SITE=none
TRUST_PROXY=1
```

3. For the Netlify frontend build, set:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

4. Build and upload `dist` to Netlify.

Important:
- Uploading only `dist` without a backend will break login and CRM calls (`/api/auth/*`, `/api/lacrm/*`).
- `SESSION_COOKIE_SAME_SITE=none` is required when frontend and backend are on different domains.

## Session Storage

- Local development: If `REDIS_URL` is missing, the app falls back to in-memory sessions.
- Production: `REDIS_URL` is required and startup fails if it is missing.
