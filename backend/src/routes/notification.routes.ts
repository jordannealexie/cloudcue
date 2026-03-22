import { Router } from "express";
import {
  getNotifications,
  notificationIdSchema,
  patchNotificationRead,
  patchNotificationsReadAll
} from "../controllers/notificationController";
import { validate } from "../middleware/validate";

const notificationRouter = Router();

notificationRouter.get("/notifications", getNotifications);
notificationRouter.patch("/notifications/read-all", patchNotificationsReadAll);
notificationRouter.patch("/notifications/:id/read", validate(notificationIdSchema, "params"), patchNotificationRead);

export default notificationRouter;
