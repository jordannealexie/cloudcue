import type { Request, Response } from "express";
import { z } from "zod";
import { createTask, deleteTask, listTasksByProject, updateTask } from "../services/taskService";
import { sendSuccess } from "../utils/http";

export const taskIdSchema = z.object({
  id: z.string().uuid()
});

export const projectTaskParamsSchema = z.object({
  id: z.string().uuid()
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1500).optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  assigneeId: z.string().uuid().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1500).nullable().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional()
});

export const getTasksByProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const tasks = await listTasksByProject(req.user!.userId, String(req.params.id));
    return sendSuccess(res, tasks);
  } catch (error) {
    throw error;
  }
};

export const createProjectTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    const task = await createTask(req.user!.userId, String(req.params.id), req.body);
    return sendSuccess(res, task, "Task created", 201);
  } catch (error) {
    throw error;
  }
};

export const patchTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    const task = await updateTask(req.user!.userId, String(req.params.id), req.body);
    return sendSuccess(res, task, "Task updated");
  } catch (error) {
    throw error;
  }
};

export const removeTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    await deleteTask(req.user!.userId, String(req.params.id));
    return res.status(204).send();
  } catch (error) {
    throw error;
  }
};
