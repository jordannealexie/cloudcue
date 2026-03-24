# CloudCue

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

<p align="center">
  A self-hostable, full-stack cloud workspace platform with Kanban project management, rich-text page editing, real-time collaboration, and S3-compatible file storage.
</p>

---

## Overview

CloudCue is a full-stack cloud workspace application built with Next.js and Node.js. It features Kanban project boards, a rich-text page editor, real-time collaboration presence powered by Socket.io, JWT-based authentication with Google OAuth, and direct file uploads to S3-compatible storage. All services are containerized with Docker Compose and proxied through Nginx for a single-command local or cloud-ready deployment.

---

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- npm 10+

---

## Getting Started

### One-Command Startup

Run from the repository root:

```bash
docker compose up --build
```

### Seed Data

After containers are up:

```bash
docker compose exec backend npx prisma db seed
```

### Demo Credentials

| Email | Password |
|---|---|
| demo@cloudcue.app | password123 |
| team@cloudcue.app | password123 |

### MinIO Console

| Field | Value |
|---|---|
| URL | http://localhost:9001 |
| Username | minioadmin |
| Password | minioadmin |

---

## Services

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Nginx (unified entry) | http://localhost |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |

---

## Environment Variables

### Root `.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT access signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh signing secret |
| `JWT_EXPIRES_IN` | Access token expiration (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration (e.g. `7d`) |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL (via Nginx: `http://localhost/api`) |
| `NODE_ENV` | Runtime mode |
| `STORAGE_ENDPOINT` | S3-compatible endpoint (MinIO in local dev) |
| `STORAGE_ACCESS_KEY` | Storage access key |
| `STORAGE_SECRET_KEY` | Storage secret key |
| `STORAGE_BUCKET` | Bucket name |
| `STORAGE_PUBLIC_URL` | Public base URL for uploaded files |
| `CLIENT_URL` | Frontend origin used for Socket.io CORS |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL |
| `SMTP_HOST` | SMTP host for transactional email |
| `SMTP_PORT` | SMTP port (e.g. `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address for password reset emails |

### Backend `.env`

All root variables apply, plus:

| Variable | Description |
|---|---|
| `PORT` | API port (default `4000`) |
| `BACKEND_PUBLIC_URL` | Public backend origin for local-fallback upload URLs |
| `STORAGE_FALLBACK_LOCAL` | Enable local disk upload fallback when MinIO/S3 is unavailable |
| `STORAGE_FORCE_LOCAL` | Always use local disk uploads regardless of MinIO/S3 status |
| `LOCAL_UPLOAD_TOKEN_SECRET` | HMAC secret for signing local upload tokens |
| `STORAGE_SYNC_INTERVAL_MS` | Interval for background local-to-storage sync worker (default `60000`) |

---

## Switching from MinIO to AWS S3

Update the following three variables:

```env
STORAGE_ENDPOINT=         # Your AWS S3 endpoint, or leave unset for AWS default
STORAGE_ACCESS_KEY=       # Your AWS access key ID
STORAGE_SECRET_KEY=       # Your AWS secret access key
```

Also update `STORAGE_BUCKET` and `STORAGE_PUBLIC_URL` to your production values.

---

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env         # Fill in your values
npm run prisma:generate
npm run dev
```

Optional preflight checks:

```bash
npm run env:check
npm run test:upload-security
npm run test:backend-smoke
```

### Frontend

```bash
cd frontend
npm install
# Ensure NEXT_PUBLIC_API_URL is set (e.g. http://localhost:4000/api)
npm run dev
```

Run all backend smoke checks from the root:

```bash
npm run test:backend:all
```

---

## Schema Migrations

After pulling backend changes, apply schema updates before running the API:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name feature-sync
```

For a non-migration local workflow:

```bash
npx prisma db push
```

---

## Production Readiness Checklist

```bash
# 1. Validate backend environment
cd backend && npm run env:check

# 2. Build backend
npm run build

# 3. Build frontend
cd ../frontend && npm run build

# 4. Run database migrations
cd ../backend && npm run prisma:migrate
```

Post-deploy smoke tests:

- `GET /api/health`
- Register / Login
- Dashboard load
- Projects / Workspace open

---

## Production Deployment

**Recommended split deployment:**

| Service | Platform |
|---|---|
| Frontend | Vercel (root directory: `frontend`) |
| Backend | Railway / Render / Fly.io / VM |

This ensures full Socket.io realtime and background worker support.

**Frontend Vercel env:**

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

Env templates are available at `backend/env.production.example` and `frontend/env.production.example`.

### Backend on Vercel (Compatibility Mode)

A serverless entrypoint is included at `backend/api/[...path].ts`. Note that in this mode:

- Socket.io realtime server is **not** started
- Local fallback sync background job is **not** started

Use a long-running backend host for full realtime and presence behavior.

---

## Storage Fallback (No MinIO)

When MinIO/S3 is unavailable, CloudCue automatically falls back to local disk storage:

- Uploads are stored in `backend/storage/uploads` and served at `/api/local-files/...`
- Local upload links are signed and replay-protected with one-time DB nonces (`upload_nonces`)
- File signatures (magic bytes) are validated against declared MIME types
- A background sync worker migrates local files back to MinIO/S3 once storage recovers

---

## Features

- **Kanban Boards** — drag-and-drop task management across project workflows
- **Rich-Text Pages** — slash command editor (`/`) with block-based content
- **Real-Time Collaboration** — live presence indicators powered by Socket.io
- **File Uploads** — direct S3/MinIO uploads with local fallback and background sync
- **Authentication** — JWT access/refresh tokens, Google OAuth, and password reset via email
- **Dark / Light Mode** — theme toggle in the top control bar
- **Mobile Responsive** — adaptive layouts, panel overlays, and camera-capable upload input
- **Keyboard Shortcuts** — `Cmd+K` for page search, `/` for slash commands
