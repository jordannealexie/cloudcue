import type { Request, Response } from "express";
import { z } from "zod";
import {
  changePassword,
  createTeamInvites,
  getDashboardStats,
  getMe,
  getUserPreferences,
  getTeamMembers,
  listTeamInvites,
  resendTeamInvite,
  revokeTeamInvite,
  revokeAllSessions,
  revokeSession,
  listUserSessions,
  updateTeamMemberRole,
  updateUserPreferences,
  updateMe
} from "../services/userService";
import { sendSuccess } from "../utils/http";

export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional()
});

export const createInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1),
  role: z.enum(["admin", "member", "viewer"])
});

export const inviteIdSchema = z.object({
  id: z.string().uuid()
});

export const updatePreferencesSchema = z.object({
  pinnedItems: z.array(z.string().min(1).max(200)).max(5).optional(),
  notifyTaskAssigned: z.boolean().optional(),
  notifyTaskOverdue: z.boolean().optional(),
  notifyTaskComment: z.boolean().optional(),
  notifyMention: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  sidebarMode: z.enum(["full", "compact"]).optional(),
  editorWidth: z.enum(["narrow", "medium", "full"]).optional(),
  fontSize: z.enum(["small", "default", "large"]).optional(),
  allowMemberInvites: z.boolean().optional()
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100)
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const sessionIdSchema = z.object({
  id: z.string().uuid()
});

export const updateTeamRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"])
});

export const teamMemberIdSchema = z.object({
  id: z.string().uuid()
});

export const me = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await getMe(req.user!.userId);
    return sendSuccess(res, user);
  } catch (error) {
    throw error;
  }
};

export const patchMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await updateMe(req.user!.userId, req.body);
    return sendSuccess(res, user, "Profile updated");
  } catch (error) {
    throw error;
  }
};

export const dashboardStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const stats = await getDashboardStats(req.user!.userId);
    return sendSuccess(res, stats);
  } catch (error) {
    throw error;
  }
};

export const teamMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const members = await getTeamMembers(req.user!.userId);
    return sendSuccess(res, members);
  } catch (error) {
    throw error;
  }
};

export const teamInvites = async (req: Request, res: Response): Promise<Response> => {
  try {
    const invites = await listTeamInvites(req.user!.userId);
    return sendSuccess(res, invites);
  } catch (error) {
    throw error;
  }
};

export const postTeamInvites = async (req: Request, res: Response): Promise<Response> => {
  try {
    const invites = await createTeamInvites(req.user!.userId, req.body);
    return sendSuccess(res, invites, "Invites created", 201);
  } catch (error) {
    throw error;
  }
};

export const postResendInvite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const invite = await resendTeamInvite(req.user!.userId, String(req.params.id));
    return sendSuccess(res, invite, "Invite resent");
  } catch (error) {
    throw error;
  }
};

export const postRevokeInvite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const invite = await revokeTeamInvite(req.user!.userId, String(req.params.id));
    return sendSuccess(res, invite, "Invite revoked");
  } catch (error) {
    throw error;
  }
};

export const userPreferences = async (req: Request, res: Response): Promise<Response> => {
  try {
    const preferences = await getUserPreferences(req.user!.userId);
    return sendSuccess(res, preferences);
  } catch (error) {
    throw error;
  }
};

export const patchUserPreferences = async (req: Request, res: Response): Promise<Response> => {
  try {
    const preferences = await updateUserPreferences(req.user!.userId, req.body);
    return sendSuccess(res, preferences, "Preferences updated");
  } catch (error) {
    throw error;
  }
};

export const patchPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    await changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, null, "Password updated");
  } catch (error) {
    throw error;
  }
};

export const userSessions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const sessions = await listUserSessions(req.user!.userId);
    return sendSuccess(res, sessions);
  } catch (error) {
    throw error;
  }
};

export const postRevokeSession = async (req: Request, res: Response): Promise<Response> => {
  try {
    await revokeSession(req.user!.userId, String(req.params.id));
    return sendSuccess(res, null, "Session revoked");
  } catch (error) {
    throw error;
  }
};

export const postRevokeAllSessions = async (req: Request, res: Response): Promise<Response> => {
  try {
    await revokeAllSessions(req.user!.userId);
    return sendSuccess(res, null, "All sessions revoked");
  } catch (error) {
    throw error;
  }
};

export const patchTeamMemberRole = async (req: Request, res: Response): Promise<Response> => {
  try {
    const members = await updateTeamMemberRole(req.user!.userId, String(req.params.id), req.body.role);
    return sendSuccess(res, members, "Role updated");
  } catch (error) {
    throw error;
  }
};
