import { Router } from "express";
import {
  createCommentSchema,
  editCommentSchema,
  getComments,
  patchComment,
  patchResolveComment,
  postComment,
  removeComment
} from "../controllers/commentController";
import { checkPagePermission } from "../middleware/checkPagePermission";
import { validate } from "../middleware/validate";
import { writeLimiter } from "../middleware/rateLimiter";

const commentRouter = Router();

commentRouter.get("/pages/:id/comments", checkPagePermission("viewer"), getComments);
commentRouter.post("/pages/:id/comments", writeLimiter, checkPagePermission("editor"), validate(createCommentSchema), postComment);
commentRouter.patch("/comments/:id", writeLimiter, validate(editCommentSchema), patchComment);
commentRouter.delete("/comments/:id", writeLimiter, removeComment);
commentRouter.patch("/comments/:id/resolve", writeLimiter, patchResolveComment);

export default commentRouter;
