import { Router } from "express";
import {
  avatarPresignSchema,
  confirmSchema,
  deleteUpload,
  postAvatarPresign,
  postConfirmUpload,
  postPresign,
  presignSchema
} from "../controllers/uploadController";
import { validate } from "../middleware/validate";
import { writeLimiter } from "../middleware/rateLimiter";

const uploadRouter = Router();

uploadRouter.post("/upload/presign", writeLimiter, validate(presignSchema), postPresign);
uploadRouter.post("/upload/avatar/presign", writeLimiter, validate(avatarPresignSchema), postAvatarPresign);
uploadRouter.post("/upload/confirm", writeLimiter, validate(confirmSchema), postConfirmUpload);
uploadRouter.delete("/upload/:fileId", writeLimiter, deleteUpload);

export default uploadRouter;
