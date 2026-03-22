import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError, sendSuccess } from "../utils/http";
import {
  archivePage,
  createPage,
  getPageById,
  listPageTree,
  movePage,
  restorePage,
  searchPages,
  updatePage
} from "../services/pageService";
import { prisma } from "../services/prisma";

export const createPageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  emoji: z.string().max(16).optional(),
  parentId: z.string().uuid().optional(),
  content: z.record(z.any()).or(z.array(z.any())).optional()
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  emoji: z.string().max(16).optional(),
  coverUrl: z.string().url().nullable().optional(),
  content: z.record(z.any()).or(z.array(z.any())).optional(),
  contentText: z.string().optional()
});

export const movePageSchema = z.object({
  parentId: z.string().uuid().nullable(),
  position: z.number().int().min(0)
});

export const permissionsSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["viewer", "editor", "admin"])
});

export const patchPermissionSchema = z.object({
  role: z.enum(["viewer", "editor", "admin"])
});

export const listPages = async (req: Request, res: Response) => {
  const pages = await listPageTree(req.user!.userId);
  return sendSuccess(res, pages);
};

export const postPage = async (req: Request, res: Response) => {
  const page = await createPage(req.user!.userId, req.body);
  return sendSuccess(res, page, "Page created", 201);
};

export const getPage = async (req: Request, res: Response) => {
  const page = await getPageById(String(req.params.id));
  return sendSuccess(res, page);
};

export const patchPage = async (req: Request, res: Response) => {
  const page = await updatePage(String(req.params.id), req.body);
  return sendSuccess(res, page, "Page updated");
};

export const deletePage = async (req: Request, res: Response) => {
  const page = await archivePage(String(req.params.id));
  return sendSuccess(res, page, "Page archived");
};

export const restoreArchivedPage = async (req: Request, res: Response) => {
  const page = await restorePage(String(req.params.id));
  return sendSuccess(res, page, "Page restored");
};

export const patchMovePage = async (req: Request, res: Response) => {
  const page = await movePage(String(req.params.id), req.body.parentId, req.body.position);
  return sendSuccess(res, page, "Page moved");
};

export const searchPageIndex = async (req: Request, res: Response) => {
  const query = String(req.query.q ?? "").trim();

  if (query.length > 120) {
    throw new ApiError(400, "Search query is too long");
  }

  if (!query) {
    return sendSuccess(res, []);
  }

  const pages = await searchPages(req.user!.userId, query);
  return sendSuccess(res, pages);
};

export const getPagePermissions = async (req: Request, res: Response) => {
  const permissions = await prisma.pagePermission.findMany({
    where: { pageId: String(req.params.id) },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
  });

  return sendSuccess(res, permissions);
};

export const postPagePermission = async (req: Request, res: Response) => {
  const permission = await prisma.pagePermission.upsert({
    where: {
      pageId_userId: {
        pageId: String(req.params.id),
        userId: req.body.userId
      }
    },
    update: { role: req.body.role },
    create: {
      pageId: String(req.params.id),
      userId: req.body.userId,
      role: req.body.role
    }
  });

  return sendSuccess(res, permission, "Permission updated", 201);
};

export const patchPagePermission = async (req: Request, res: Response) => {
  const page = await prisma.page.findUnique({
    where: { id: String(req.params.id) },
    select: { createdById: true }
  });

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  if (page.createdById === String(req.params.userId)) {
    throw new ApiError(400, "Cannot change page owner role");
  }

  const permission = await prisma.pagePermission.update({
    where: {
      pageId_userId: {
        pageId: String(req.params.id),
        userId: String(req.params.userId)
      }
    },
    data: { role: req.body.role }
  });

  return sendSuccess(res, permission, "Permission role updated");
};

export const removePagePermission = async (req: Request, res: Response) => {
  const page = await prisma.page.findUnique({
    where: { id: String(req.params.id) },
    select: { createdById: true }
  });

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  if (page.createdById === String(req.params.userId)) {
    throw new ApiError(400, "Cannot remove page owner");
  }

  if (String(req.params.userId) === req.user!.userId) {
    throw new ApiError(400, "Cannot remove your own admin access");
  }

  await prisma.pagePermission.delete({
    where: {
      pageId_userId: {
        pageId: String(req.params.id),
        userId: String(req.params.userId)
      }
    }
  });

  return sendSuccess(res, null, "Permission removed");
};
