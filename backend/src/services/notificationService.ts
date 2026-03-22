import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

type NotificationType = "mention" | "task" | "comment" | "system";

export const createNotification = async (payload: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to create notification");
  }
};

export const listNotifications = async (
  userId: string,
  filter: "all" | "unread" | "mentions" | "tasks" | "comments" | "system"
) => {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(filter === "unread" ? { readAt: null } : {}),
        ...(filter === "mentions" ? { type: "mention" } : {}),
        ...(filter === "tasks" ? { type: "task" } : {}),
        ...(filter === "comments" ? { type: "comment" } : {}),
        ...(filter === "system" ? { type: "system" } : {})
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load notifications");
  }
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  try {
    const existing = await prisma.notification.findUnique({ where: { id: notificationId } });

    if (!existing || existing.userId !== userId) {
      throw new ApiError(404, "Notification not found");
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to mark notification as read");
  }
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to mark all notifications as read");
  }
};
