import { Router } from "express";
import {
	createInviteSchema,
	changePasswordSchema,
	dashboardStats,
	inviteIdSchema,
	me,
	patchMe,
	patchPassword,
	patchUserPreferences,
	postRevokeAllSessions,
	postRevokeSession,
	postResendInvite,
	postRevokeInvite,
	postTeamInvites,
	patchTeamMemberRole,
	sessionIdSchema,
	teamMemberIdSchema,
	updatePreferencesSchema,
	updateTeamRoleSchema,
	teamInvites,
	teamMembers,
	userSessions,
	userPreferences,
	updateMeSchema
} from "../controllers/userController";
import { validate } from "../middleware/validate";
import { writeLimiter } from "../middleware/rateLimiter";

const userRouter = Router();

userRouter.get("/users/me", me);
userRouter.patch("/users/me", validate(updateMeSchema), patchMe);
userRouter.get("/dashboard/stats", dashboardStats);
userRouter.get("/team/members", teamMembers);
userRouter.patch("/team/members/:id/role", validate(teamMemberIdSchema, "params"), validate(updateTeamRoleSchema), patchTeamMemberRole);
userRouter.get("/team/invites", teamInvites);
userRouter.post("/team/invites", writeLimiter, validate(createInviteSchema), postTeamInvites);
userRouter.post("/team/invites/:id/resend", writeLimiter, validate(inviteIdSchema, "params"), postResendInvite);
userRouter.post("/team/invites/:id/revoke", writeLimiter, validate(inviteIdSchema, "params"), postRevokeInvite);
userRouter.get("/users/preferences", userPreferences);
userRouter.patch("/users/preferences", writeLimiter, validate(updatePreferencesSchema), patchUserPreferences);
userRouter.patch("/users/password", writeLimiter, validate(changePasswordSchema), patchPassword);
userRouter.get("/users/sessions", userSessions);
userRouter.post("/users/sessions/:id/revoke", writeLimiter, validate(sessionIdSchema, "params"), postRevokeSession);
userRouter.post("/users/sessions/revoke-all", writeLimiter, postRevokeAllSessions);

export default userRouter;
