import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  assigneeId?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  assigneeId?: string | null;
  position?: number;
}

const assertProjectMembership = async (userId: string, projectId: string): Promise<void> => {
  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!member) {
    throw new ApiError(403, "You do not have access to this project");
  }
};

/** Lists tasks by project for authorized users. */
export const listTasksByProject = async (userId: string, projectId: string) => {
  try {
    await assertProjectMembership(userId, projectId);

    return await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      },
      orderBy: [{ status: "asc" }, { position: "asc" }]
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to list tasks");
  }
};

/** Creates a new task in a project with positional ordering. */
export const createTask = async (userId: string, projectId: string, input: CreateTaskInput) => {
  try {
    await assertProjectMembership(userId, projectId);

    const columnStatus = input.status ?? "todo";
    const last = await prisma.task.findFirst({
      where: { projectId, status: columnStatus },
      orderBy: { position: "desc" }
    });

    return await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: columnStatus,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        estimatedHours: input.estimatedHours,
        assigneeId: input.assigneeId,
        position: (last?.position ?? -1) + 1,
        projectId
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to create task");
  }
};

/** Updates task fields including drag-and-drop status and position changes. */
export const updateTask = async (userId: string, taskId: string, input: UpdateTaskInput) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });

    if (!existing) {
      throw new ApiError(404, "Task not found");
    }

    await assertProjectMembership(userId, existing.projectId);

    if (input.status && typeof input.position === "number") {
      await prisma.task.updateMany({
        where: {
          projectId: existing.projectId,
          status: input.status,
          id: { not: taskId },
          position: { gte: input.position }
        },
        data: {
          position: { increment: 1 }
        }
      });
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate === null ? null : input.dueDate ? new Date(input.dueDate) : undefined,
        estimatedHours: typeof input.estimatedHours === "number" ? input.estimatedHours : input.estimatedHours === null ? null : undefined,
        assigneeId: input.assigneeId,
        position: input.position
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to update task");
  }
};

/** Deletes a task that belongs to an accessible project. */
export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });

    if (!existing) {
      throw new ApiError(404, "Task not found");
    }

    await assertProjectMembership(userId, existing.projectId);
    await prisma.task.delete({ where: { id: taskId } });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to delete task");
  }
};
