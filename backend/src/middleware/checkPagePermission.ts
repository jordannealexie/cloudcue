import type { NextFunction, Request, Response } from "express";
import { prisma } from "../services/prisma";
import { ApiError } from "../utils/http";

const roleRank: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

export const checkPagePermission = (requiredRole: "viewer" | "editor" | "admin") => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const pageId = String(req.params.id ?? req.params.pageId);
      const userId = req.user?.userId;

      if (!pageId || !userId) {
        throw new ApiError(400, "Missing page id or user context");
      }

      const page = await prisma.page.findUnique({
        where: { id: pageId },
        select: { createdById: true }
      });

      if (!page) {
        throw new ApiError(404, "Page not found");
      }

      if (page.createdById === userId) {
        next();
        return;
      }

      const permission = await prisma.pagePermission.findUnique({
        where: {
          pageId_userId: {
            pageId,
            userId
          }
        }
      });

      if (!permission) {
        throw new ApiError(403, "Access denied");
      }

      if (roleRank[permission.role] < roleRank[requiredRole]) {
        throw new ApiError(403, "Insufficient page role");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
