# Backend Testing Checklist

This checklist provides manual and scaffolded validation paths for the newly added flows.

## Prerequisites

1. Apply schema updates:
   - npx prisma generate
   - npx prisma migrate dev --name hardening-sync
2. Start backend service.
3. Authenticate with a valid user and keep a bearer token.

## Auth and Security

1. Forgot password request:
   - POST /api/auth/forgot-password with existing email and non-existing email.
   - Expect identical success message to prevent account enumeration.
2. Reset password:
   - POST /api/auth/reset-password with a valid token and new password.
   - Verify old password no longer works.
3. Change password:
   - PATCH /api/users/password with currentPassword, newPassword, confirmPassword.
   - Verify refresh sessions are revoked.

## Sessions

1. List sessions:
   - GET /api/users/sessions
2. Revoke one session:
   - POST /api/users/sessions/:id/revoke
3. Revoke all sessions:
   - POST /api/users/sessions/revoke-all

## Team Management

1. List members:
   - GET /api/team/members
2. Update member role:
   - PATCH /api/team/members/:id/role with admin/member/viewer
   - Ensure only owner can update roles.
3. Invite lifecycle:
   - POST /api/team/invites
   - GET /api/team/invites
   - POST /api/team/invites/:id/resend
   - POST /api/team/invites/:id/revoke

## Notifications

1. Fetch notifications:
   - GET /api/notifications?filter=all
   - GET /api/notifications?filter=unread
   - GET /api/notifications?filter=mentions
   - GET /api/notifications?filter=tasks
   - GET /api/notifications?filter=comments
2. Mark read:
   - PATCH /api/notifications/:id/read
3. Mark all read:
   - PATCH /api/notifications/read-all

## Comments Authorization

1. Try editing/deleting/resolving comments as:
   - comment author
   - page owner
   - page editor
   - unrelated user
2. Verify unauthorized user receives 403.

## Rate Limiting

1. Burst test comment, upload, team invite, and security write endpoints.
2. Verify response body:
   - success: false
   - message: Too many write requests, please slow down
