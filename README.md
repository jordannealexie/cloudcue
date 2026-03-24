# CloudCue

CloudCue is a full-stack cloud task management and Notion-style workspace app with projects, Kanban boards, pages, comments, mentions, direct-to-storage uploads, and real-time collaboration presence.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- npm 10+

## One-Command Startup

Run from the repository root:

docker compose up --build

## Seed Data

After containers are up:

docker compose exec backend npx prisma db seed

## MinIO Console

- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

## Demo Credentials

- demo@cloudcue.app / password123
- team@cloudcue.app / password123

## Environment Variables

### Root .env

- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: JWT access signing secret
- JWT_REFRESH_SECRET: JWT refresh signing secret
- JWT_EXPIRES_IN: Access token expiration (for example 15m)
- JWT_REFRESH_EXPIRES_IN: Refresh token expiration (for example 7d)
- NEXT_PUBLIC_API_URL: Frontend API base URL (through Nginx use http://localhost/api)
- NODE_ENV: Runtime mode
- STORAGE_ENDPOINT: S3-compatible endpoint (MinIO in local dev)
- STORAGE_ACCESS_KEY: Storage access key
- STORAGE_SECRET_KEY: Storage secret key
- STORAGE_BUCKET: Bucket name
- STORAGE_PUBLIC_URL: Public base URL for uploaded files
- CLIENT_URL: Frontend origin used for socket CORS
- GOOGLE_CLIENT_ID: Google OAuth web client id
- GOOGLE_CLIENT_SECRET: Google OAuth client secret
- GOOGLE_REDIRECT_URI: Google OAuth callback URL (for example http://localhost:4000/api/auth/google/callback)
- SMTP_HOST: SMTP host for transactional email (password reset)
- SMTP_PORT: SMTP port (for example 587)
- SMTP_USER: SMTP username
- SMTP_PASS: SMTP password
- SMTP_FROM: From address used in password reset emails

### Backend .env

- PORT: API port (default 4000)
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: JWT access signing secret
- JWT_REFRESH_SECRET: JWT refresh signing secret
- JWT_EXPIRES_IN: Access token expiration
- JWT_REFRESH_EXPIRES_IN: Refresh token expiration
- NODE_ENV: Runtime mode
- STORAGE_ENDPOINT: S3/MinIO endpoint
- STORAGE_ACCESS_KEY: S3/MinIO access key
- STORAGE_SECRET_KEY: S3/MinIO secret key
- STORAGE_BUCKET: Upload bucket
- STORAGE_PUBLIC_URL: Public URL base for files
- BACKEND_PUBLIC_URL: Public backend origin used for local-fallback upload URLs (default http://localhost:4000)
- STORAGE_FALLBACK_LOCAL: Enable local disk upload fallback when MinIO/S3 is unavailable
- STORAGE_FORCE_LOCAL: Always use local disk uploads regardless of MinIO/S3 status
- LOCAL_UPLOAD_TOKEN_SECRET: HMAC secret used to sign local upload tokens (falls back to JWT_SECRET)
- STORAGE_SYNC_INTERVAL_MS: Interval for background local-to-storage sync worker (default 60000)
- CLIENT_URL: Allowed frontend origin for Socket.io
- GOOGLE_CLIENT_ID: Google OAuth web client id
- GOOGLE_CLIENT_SECRET: Google OAuth client secret
- GOOGLE_REDIRECT_URI: Google OAuth callback URL
- SMTP_HOST: SMTP host for transactional email
- SMTP_PORT: SMTP port
- SMTP_USER: SMTP username
- SMTP_PASS: SMTP password
- SMTP_FROM: Sender address for reset emails

## Switching From MinIO To Real AWS S3

Change these three variables:

- STORAGE_ENDPOINT -> your AWS S3 endpoint or leave unset for AWS default
- STORAGE_ACCESS_KEY -> your AWS access key id
- STORAGE_SECRET_KEY -> your AWS secret access key

Also set STORAGE_BUCKET to your production bucket name and STORAGE_PUBLIC_URL to your production file base URL.

## Light And Dark Mode Toggle

Theme toggle is in the top control bar on dashboard and workspace pages.

## Keyboard Shortcuts

- Cmd+K: Open page search
- /: Open slash command menu in editor

## Mobile Usage Notes

- Workspace page tree is hidden by default on small screens
- Comment thread opens as a panel overlay
- Workspace cards collapse into a single-column list on mobile
- Upload flow works with direct file selection and camera capture capable file input

## Local Non-Docker Development

### Backend

1. cd backend
2. npm install
3. copy .env.example to .env
4. npm run prisma:generate
	- If Prisma fails with EPERM rename lock on Windows, use npm run prisma:generate:safe
5. npm run dev

Optional preflight check:

6. npm run env:check
7. npm run test:upload-security
8. npm run test:backend-smoke

### Frontend

1. cd frontend
2. npm install
3. ensure NEXT_PUBLIC_API_URL is set (for direct API: http://localhost:4000/api)
4. npm run dev

From repository root, you can run all backend smoke checks in one command:

1. npm run test:backend:all

## Schema Migration Checklist

After pulling recent backend changes, apply schema updates before running the API:

1. cd backend
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name feature-sync

If you are in a non-migration local workflow:

1. npx prisma db push

## Production Readiness Checklist

1. Backend env validation
	- cd backend
	- npm run env:check
2. Backend build
	- npm run build
3. Frontend build
	- cd ../frontend
	- npm run build
4. Database migration on target environment
	- cd ../backend
	- npm run prisma:migrate
5. Post-deploy smoke
	- GET /api/health
	- Register/Login
	- Dashboard load
	- Projects/Workspace open

## Production Deployment (Split Recommended)

Recommended deployment model:

- Frontend on Vercel (root directory: frontend)
- Backend on a long-running Node host (Railway/Render/Fly/VM)

This keeps realtime Socket.io and background worker behavior fully available.

Frontend Vercel env:

- NEXT_PUBLIC_API_URL=https://your-backend-domain/api

Backend env templates:

- backend/env.production.example
- frontend/env.production.example

## Backend On Vercel (Compatibility Mode)

Backend includes a Vercel serverless entrypoint:

- backend/api/[...path].ts

In compatibility mode, core API/auth/CRUD endpoints can work, but there are limitations:

- Socket.io realtime server is not started.
- Local fallback sync background job is not started.

Use a long-running backend host if you need full realtime/presence behavior.

## Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Nginx unified entry: http://localhost
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001

## Storage Fallback (No MinIO)

- When MinIO/S3 is unavailable, uploads automatically fall back to local disk in backend/storage/uploads.
- Fallback files are served by the backend at /api/local-files/....
- Local upload links are signed and replay-protected with one-time DB nonces in upload_nonces.
- Local fallback uploads validate file signatures (magic bytes) against declared MIME types.
- A background sync worker migrates local fallback references back to MinIO/S3 when storage recovers.
