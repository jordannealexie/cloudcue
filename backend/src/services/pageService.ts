import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

export const listPageTree = async (userId: string) => {
  try {
    return prisma.page.findMany({
      where: {
        isArchived: false,
        OR: [{ createdById: userId }, { permissions: { some: { userId } } }]
      },
      include: {
        children: true,
        permissions: true
      },
      orderBy: [{ parentId: "asc" }, { position: "asc" }, { createdAt: "asc" }]
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to fetch page tree");
  }
};

export const createPage = async (userId: string, payload: { title?: string; emoji?: string; parentId?: string; content?: object }) => {
  try {
    const siblingCount = await prisma.page.count({ where: { parentId: payload.parentId ?? null } });

    const page = await prisma.page.create({
      data: {
        title: payload.title ?? "Untitled",
        emoji: payload.emoji,
        parentId: payload.parentId,
        content: payload.content ?? [{ type: "paragraph", content: [] }],
        contentText: payload.title ?? "Untitled",
        createdById: userId,
        position: siblingCount
      },
      include: {
        children: true,
        permissions: true,
        comments: true,
        files: true
      }
    });

    await prisma.pagePermission.create({
      data: {
        pageId: page.id,
        userId,
        role: "admin"
      }
    });

    return page;
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to create page");
  }
};

export const getPageById = async (id: string) => {
  try {
    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        children: { orderBy: { position: "asc" } },
        permissions: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
            replies: { include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } } }
          }
        },
        files: true
      }
    });

    if (!page) {
      throw new ApiError(404, "Page not found");
    }

    return page;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to fetch page");
  }
};

export const updatePage = async (id: string, payload: { title?: string; emoji?: string; coverUrl?: string | null; content?: object; contentText?: string }) => {
  try {
    return await prisma.page.update({
      where: { id },
      data: payload
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to update page");
  }
};

export const archivePage = async (id: string) => prisma.page.update({ where: { id }, data: { isArchived: true } });
export const restorePage = async (id: string) => prisma.page.update({ where: { id }, data: { isArchived: false } });

export const movePage = async (id: string, parentId: string | null, position: number) => {
  try {
    return prisma.page.update({ where: { id }, data: { parentId, position } });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to move page");
  }
};

export const searchPages = async (userId: string, query: string) => {
  try {
    return prisma.page.findMany({
      where: {
        isArchived: false,
        OR: [{ createdById: userId }, { permissions: { some: { userId } } }],
        AND: [{ OR: [{ title: { contains: query, mode: "insensitive" } }, { contentText: { contains: query, mode: "insensitive" } }] }]
      },
      select: {
        id: true,
        title: true,
        emoji: true,
        contentText: true,
        parentId: true,
        updatedAt: true
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to search pages");
  }
};

export const listPageTemplates = async (userId: string) => {
  try {
    const prismaClient = prisma as unknown as {
      pageTemplate: {
        findMany: (args: unknown) => Promise<unknown>;
        create: (args: unknown) => Promise<unknown>;
        findUnique: (args: unknown) => Promise<{ userId: string } | null>;
        delete: (args: unknown) => Promise<unknown>;
      };
    };

    return await prismaClient.pageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to load page templates");
  }
};

export const createPageTemplate = async (userId: string, payload: { name: string; content: unknown }) => {
  try {
    const prismaClient = prisma as unknown as {
      pageTemplate: {
        create: (args: unknown) => Promise<unknown>;
      };
    };

    return await prismaClient.pageTemplate.create({
      data: {
        userId,
        name: payload.name,
        content: payload.content as object
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to create page template");
  }
};

export const deletePageTemplate = async (userId: string, templateId: string) => {
  try {
    const prismaClient = prisma as unknown as {
      pageTemplate: {
        findUnique: (args: unknown) => Promise<{ userId: string } | null>;
        delete: (args: unknown) => Promise<unknown>;
      };
    };

    const template = await prismaClient.pageTemplate.findUnique({ where: { id: templateId } });
    if (!template || template.userId !== userId) {
      throw new ApiError(404, "Template not found");
    }

    await prismaClient.pageTemplate.delete({ where: { id: templateId } });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to delete page template");
  }
};

export const getPageExportData = async (id: string) => {
  try {
    const page = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        contentText: true,
        updatedAt: true
      }
    });

    if (!page) {
      throw new ApiError(404, "Page not found");
    }

    return page;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to export page");
  }
};
