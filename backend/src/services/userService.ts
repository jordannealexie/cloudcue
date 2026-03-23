import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";
import { sendPasswordResetEmail } from "./emailService";

interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

interface UpdateMeInput {
  name?: string;
  avatarUrl?: string | null;
}

/** Creates a short-lived reset token and logs a reset URL for local development. */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success semantics to avoid account enumeration.
    if (!user) {
      return;
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null
      }
    });

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetUrl
    });
  } catch (_error) {
    rethrowPrismaRuntimeError(_error);

    throw new ApiError(500, "Unable to request password reset");
  }
};

/** Validates a reset token and updates password hash. */
export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<void> => {
  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ApiError(400, "Reset token is invalid or expired");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      }),
      prisma.refreshToken.deleteMany({ where: { userId: record.userId } })
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to reset password");
  }
};

/** Creates a new user account with a securely hashed password. */
export const registerUser = async (payload: RegisterInput) => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    return prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to register user");
  }
};

/** Validates user credentials and returns the authenticated profile. */
export const loginUser = async (email: string, password: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to login user");
  }
};

/** Returns the currently authenticated user profile. */
export const getMe = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to fetch current user");
  }
};

/** Updates editable profile fields for the current user. */
export const updateMe = async (userId: string, data: UpdateMeInput) => {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to update profile");
  }
};

/** Aggregates dashboard metrics and weekly activity for the current user. */
export const getDashboardStats = async (userId: string) => {
  try {
    const [totalTasks, inProgress, completedToday, overdue, weeklyBuckets] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.task.count({ where: { assigneeId: userId, status: "in_progress" } }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: "done",
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: new Date() },
          status: { not: "done" }
        }
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: "done",
          updatedAt: {
            gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          }
        },
        select: { updatedAt: true }
      })
    ]);

    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const count = weeklyBuckets.filter((task: { updatedAt: Date }) => task.updatedAt.toISOString().slice(0, 10) === key).length;
      return { date: key, count };
    });

    return { totalTasks, inProgress, completedToday, overdue, weeklyActivity };
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load dashboard stats");
  }
};

/** Lists unique workspace collaborators from projects the current user belongs to. */
export const getTeamMembers = async (userId: string) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: {
        project: {
          members: {
            some: {
              userId
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      }
    });

    const roleRank: Record<string, number> = {
      viewer: 1,
      member: 2,
      editor: 3,
      owner: 4
    };

    const aggregate = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string | null;
        role: "admin" | "member" | "viewer";
        projectCount: number;
        joinedAt: Date;
      }
    >();

    for (const membership of memberships) {
      const existing = aggregate.get(membership.userId);
      const mappedRole = roleRank[membership.role] >= roleRank.owner ? "admin" : membership.role === "viewer" ? "viewer" : "member";

      if (!existing) {
        aggregate.set(membership.userId, {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          avatarUrl: membership.user.avatarUrl,
          role: mappedRole,
          projectCount: 1,
          joinedAt: membership.user.createdAt
        });
        continue;
      }

      existing.projectCount += 1;
      if (mappedRole === "admin") {
        existing.role = "admin";
      }
    }

    return Array.from(aggregate.values()).sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load team members");
  }
};

export const listTeamInvites = async (userId: string) => {
  try {
    return await prisma.teamInvite.findMany({
      where: {
        invitedById: userId
      },
      orderBy: {
        sentAt: "desc"
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load invites");
  }
};

export const createTeamInvites = async (
  userId: string,
  payload: { emails: string[]; role: "admin" | "member" | "viewer" }
) => {
  try {
    const invites = [] as Array<{
      id: string;
      email: string;
      role: string;
      status: string;
      invitedById: string;
      sentAt: Date;
      revokedAt: Date | null;
    }>;

    for (const email of payload.emails) {
      const normalized = email.toLowerCase().trim();
      if (!normalized) {
        continue;
      }

      const existing = await prisma.teamInvite.findFirst({
        where: {
          invitedById: userId,
          email: normalized,
          status: "pending"
        }
      });

      if (existing) {
        invites.push(existing);
        continue;
      }

      const created = await prisma.teamInvite.create({
        data: {
          email: normalized,
          role: payload.role,
          invitedById: userId
        }
      });

      invites.push(created);
    }

    return invites;
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to create invites");
  }
};

export const resendTeamInvite = async (userId: string, inviteId: string) => {
  try {
    const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId } });

    if (!invite || invite.invitedById !== userId) {
      throw new ApiError(404, "Invite not found");
    }

    if (invite.status !== "pending") {
      throw new ApiError(400, "Only pending invites can be resent");
    }

    return await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { sentAt: new Date() }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to resend invite");
  }
};

export const revokeTeamInvite = async (userId: string, inviteId: string) => {
  try {
    const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId } });

    if (!invite || invite.invitedById !== userId) {
      throw new ApiError(404, "Invite not found");
    }

    return await prisma.teamInvite.update({
      where: { id: inviteId },
      data: {
        status: "revoked",
        revokedAt: new Date()
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to revoke invite");
  }
};

export const getUserPreferences = async (userId: string) => {
  try {
    const existing = await prisma.userPreference.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }

    return await prisma.userPreference.create({
      data: {
        userId
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load preferences");
  }
};

export const updateUserPreferences = async (
  userId: string,
  payload: {
    pinnedItems?: string[];
    notifyTaskAssigned?: boolean;
    notifyTaskOverdue?: boolean;
    notifyTaskComment?: boolean;
    notifyMention?: boolean;
    emailWeeklyDigest?: boolean;
    theme?: "light" | "dark" | "system";
    sidebarMode?: "full" | "compact";
    editorWidth?: "narrow" | "medium" | "full";
    fontSize?: "small" | "default" | "large";
    allowMemberInvites?: boolean;
  }
) => {
  try {
    return await prisma.userPreference.upsert({
      where: { userId },
      update: payload,
      create: {
        userId,
        ...payload
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to update preferences");
  }
};

export const changePassword = async (userId: string, currentPassword: string, nextPassword: string): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ApiError(400, "Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(nextPassword, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.refreshToken.deleteMany({ where: { userId } })
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to change password");
  }
};

export const listUserSessions = async (userId: string) => {
  try {
    return await prisma.refreshToken.findMany({
      where: { userId },
      select: {
        id: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load sessions");
  }
};

export const revokeSession = async (userId: string, sessionId: string): Promise<void> => {
  try {
    const session = await prisma.refreshToken.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new ApiError(404, "Session not found");
    }

    await prisma.refreshToken.delete({ where: { id: sessionId } });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to revoke session");
  }
};

export const revokeAllSessions = async (userId: string): Promise<void> => {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to revoke sessions");
  }
};

export const updateTeamMemberRole = async (
  userId: string,
  targetUserId: string,
  role: "admin" | "member" | "viewer"
) => {
  try {
    if (userId === targetUserId) {
      throw new ApiError(400, "You cannot change your own role here");
    }

    const myProjectMemberships = await prisma.projectMember.findMany({
      where: {
        userId,
        role: "owner"
      },
      select: { projectId: true }
    });

    const projectIds = myProjectMemberships.map((membership: { projectId: string }) => membership.projectId);

    if (projectIds.length === 0) {
      throw new ApiError(403, "Only project owners can change member roles");
    }

    const mapped = role === "admin" ? "owner" : role;

    const updated = await prisma.projectMember.updateMany({
      where: {
        userId: targetUserId,
        projectId: {
          in: projectIds
        }
      },
      data: {
        role: mapped
      }
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Target member was not found in your owned projects");
    }

    return getTeamMembers(userId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to update member role");
  }
};
