import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../utils/http";
import {
  createComment,
  deleteComment,
  listCommentsByPage,
  resolveComment,
  updateComment
} from "../services/commentService";
import { prisma } from "../services/prisma";
import { getSocketServer } from "../socket/state";
import {
  emitCommentDeleted,
  emitCommentNew,
  emitCommentResolved,
  emitCommentUpdated,
  emitMentionReceived
} from "../socket/handlers/commentHandler";
import { createNotification } from "../services/notificationService";

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional()
});

export const editCommentSchema = z.object({
  content: z.string().min(1).max(5000)
});

export const getComments = async (req: Request, res: Response) => {
  const comments = await listCommentsByPage(String(req.params.id));
  return sendSuccess(res, comments);
};

export const postComment = async (req: Request, res: Response) => {
  const comment = await createComment(String(req.params.id), req.user!.userId, req.body);

  const io = getSocketServer();
  if (io) {
    emitCommentNew(io, String(req.params.id), comment);

    const page = await prisma.page.findUnique({
      where: { id: String(req.params.id) },
      select: { id: true, title: true }
    });

    const mentions = await prisma.commentMention.findMany({
      where: { commentId: comment.id },
      select: { userId: true }
    });

    for (const mention of mentions) {
      await createNotification({
        userId: mention.userId,
        type: "mention",
        title: `${req.user?.name ?? req.user?.email ?? "Someone"} mentioned you`,
        body: `In ${page?.title ?? "Untitled"}`,
        link: `/workspace/${String(req.params.id)}`
      });

      emitMentionReceived(io, mention.userId, {
        pageId: String(req.params.id),
        pageTitle: page?.title ?? "Untitled",
        commentId: comment.id,
        fromUser: req.user?.name ?? req.user?.email ?? "Unknown"
      });
    }
  }

  return sendSuccess(res, comment, "Comment added", 201);
};

export const patchComment = async (req: Request, res: Response) => {
  const comment = await updateComment(String(req.params.id), req.user!.userId, req.body.content);
  const io = getSocketServer();
  if (io) {
    emitCommentUpdated(io, comment.pageId, comment);
  }
  return sendSuccess(res, comment, "Comment updated");
};

export const removeComment = async (req: Request, res: Response) => {
  const commentId = String(req.params.id);
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { pageId: true } });
  await deleteComment(commentId, req.user!.userId);

  const io = getSocketServer();
  if (io && comment?.pageId) {
    emitCommentDeleted(io, comment.pageId, commentId);
  }

  return sendSuccess(res, null, "Comment deleted");
};

export const patchResolveComment = async (req: Request, res: Response) => {
  const comment = await resolveComment(String(req.params.id), req.user!.userId);
  const io = getSocketServer();
  if (io) {
    emitCommentResolved(io, comment.pageId, comment.id);
  }
  return sendSuccess(res, comment, "Comment resolved");
};
