import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../utils/http";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notificationService";

export const notificationFilterSchema = z.object({
  filter: z.enum(["all", "unread", "mentions", "tasks", "comments", "system"]).optional()
});

export const notificationIdSchema = z.object({
  id: z.string().uuid()
});

export const getNotifications = async (req: Request, res: Response) => {
  const parsed = notificationFilterSchema.safeParse(req.query);
  const filter = parsed.success ? parsed.data.filter ?? "all" : "all";

  const items = await listNotifications(req.user!.userId, filter);
  return sendSuccess(res, items);
};

export const patchNotificationRead = async (req: Request, res: Response) => {
  const item = await markNotificationRead(req.user!.userId, String(req.params.id));
  return sendSuccess(res, item, "Notification marked as read");
};

export const patchNotificationsReadAll = async (req: Request, res: Response) => {
  await markAllNotificationsRead(req.user!.userId);
  return sendSuccess(res, null, "All notifications marked as read");
};
