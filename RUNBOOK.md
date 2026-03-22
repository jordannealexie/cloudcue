# CloudCue Runbook

## 1. Apply Backend Schema Updates

1. cd backend
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name stabilization-sync

Alternative local-only flow:

1. npx prisma db push

## 1.5 Deployment Preflight

1. Verify environment variables
   - cd backend
   - npm run env:check
2. Verify database reachability from backend runtime
   - ensure DATABASE_URL points to a reachable PostgreSQL instance
3. Verify storage credentials and endpoint
   - STORAGE_ENDPOINT
   - STORAGE_ACCESS_KEY
   - STORAGE_SECRET_KEY
   - STORAGE_BUCKET
4. Verify frontend API base URL
   - NEXT_PUBLIC_API_URL should point to the deployed API path

If any required variable is missing, backend startup now fails early with an explicit list.

## 2. Start Services

### Docker flow

1. cd ..
2. docker compose up --build

### Local split flow

1. Terminal A:
   - cd backend
   - npm run dev
2. Terminal B:
   - cd frontend
   - npm run dev

## 3. Seed Demo Data

1. cd backend
2. npm run prisma:seed

## 4. Smoke Test Order

1. Auth
   - Register
   - Login
   - Forgot password request
   - Reset password
2. Dashboard and Projects
   - Open dashboard
   - Open project board/list/calendar views
   - Create/edit/move task
3. Workspace
   - Create page
   - Edit content and verify autosave
   - Post/resolve comments
   - Share and permission edits
   - Upload and delete file
4. Team
   - List members
   - Change member role
   - Send/resend/revoke invite
5. Notifications
   - Trigger a mention
   - Verify unread badge
   - Open notifications filters
   - Mark one and mark all as read
6. Settings and Security
   - Update profile
   - Change password
   - Revoke single/all sessions
   - Toggle preference settings

## 5. Hardening Verification

1. Unauthorized comment edit/delete should return 403.
2. Unauthorized upload delete should return 403.
3. Owner protections should block page owner role removal.
4. High-volume writes should trigger rate limiter responses.

## 6. Production Deploy Sequence

1. Build artifacts
   - cd backend
   - npm install
   - npm run build
   - cd ../frontend
   - npm install
   - npm run build
2. Apply database migration on target environment
   - cd ../backend
   - npm run prisma:migrate
3. Start backend and verify health endpoint
   - GET /api/health should return success true and status ok
4. Start frontend and validate key routes
   - /login
   - /register
   - /dashboard
   - /projects
   - /workspace
