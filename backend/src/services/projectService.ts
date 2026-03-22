import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

interface CreateProjectInput {
  name: string;
  description?: string;
  color: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  color?: string;
}

/** Returns all projects where the user is a member. */
export const listProjectsForUser = async (userId: string) => {
  try {
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true }
                }
              }
            },
            tasks: true
          }
        }
      }
    });

    return projectMembers.map((member: (typeof projectMembers)[number]) => member.project);
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to list projects");
  }
};

/** Creates a new project and adds creator as owner. */
export const createProject = async (userId: string, input: CreateProjectInput) => {
  try {
    return await prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        members: {
          create: {
            userId,
            role: "owner"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        tasks: true
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to create project");
  }
};

/** Returns full project details with members and tasks if member has access. */
export const getProjectById = async (userId: string, projectId: string) => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this project");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          },
          orderBy: [{ status: "asc" }, { position: "asc" }]
        }
      }
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    return project;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to get project details");
  }
};

/** Updates project metadata if the user is a member. */
export const updateProject = async (userId: string, projectId: string, input: UpdateProjectInput) => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this project");
    }

    return await prisma.project.update({
      where: { id: projectId },
      data: input,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        tasks: true
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to update project");
  }
};

/** Deletes a project if the user has access. */
export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this project");
    }

    await prisma.project.delete({ where: { id: projectId } });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to delete project");
  }
};
