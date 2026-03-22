import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

const mentionRegex = /@\[([^\]]+)\]/g;

const assertCommentWriteAccess = async (commentId: string, userId: string): Promise<{ pageId: string }> => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      page: {
        select: {
          id: true,
          createdById: true
        }
      }
    }
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.authorId === userId || comment.page.createdById === userId) {
    return { pageId: comment.pageId };
  }

  const permission = await prisma.pagePermission.findUnique({
    where: {
      pageId_userId: {
        pageId: comment.pageId,
        userId
      }
    }
  });

  if (!permission || !["editor", "admin"].includes(permission.role)) {
    throw new ApiError(403, "You do not have permission to modify this comment");
  }

  return { pageId: comment.pageId };
};

export const listCommentsByPage = async (pageId: string) => {
  return prisma.comment.findMany({
    where: { pageId, parentId: null },
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } }
        },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const createComment = async (pageId: string, authorId: string, payload: { content: string; parentId?: string }) => {
  try {
    const comment = await prisma.comment.create({
      data: {
        pageId,
        authorId,
        content: payload.content,
        parentId: payload.parentId
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    const mentions = [...payload.content.matchAll(mentionRegex)].map((match) => match[1]);
    if (mentions.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          OR: mentions.map((name) => ({ name: { equals: name, mode: "insensitive" } }))
        },
        select: { id: true }
      });

      for (const user of users) {
        await prisma.commentMention.create({
          data: {
            commentId: comment.id,
            userId: user.id
          }
        });
      }
    }

    return comment;
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to create comment");
  }
};

export const updateComment = async (id: string, userId: string, content: string) => {
  await assertCommentWriteAccess(id, userId);
  return prisma.comment.update({ where: { id }, data: { content } });
};

export const deleteComment = async (id: string, userId: string) => {
  await assertCommentWriteAccess(id, userId);
  return prisma.comment.delete({ where: { id } });
};

export const resolveComment = async (id: string, userId: string) => {
  await assertCommentWriteAccess(id, userId);
  return prisma.comment.update({ where: { id }, data: { resolvedAt: new Date() } });
};
