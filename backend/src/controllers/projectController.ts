import type { Request, Response } from "express";
import { z } from "zod";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjectsForUser,
  updateProject
} from "../services/projectService";
import { sendSuccess } from "../utils/http";

export const projectIdSchema = z.object({
  id: z.string().uuid()
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

export const getProjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const projects = await listProjectsForUser(req.user!.userId);
    return sendSuccess(res, projects);
  } catch (error) {
    throw error;
  }
};

export const createNewProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const project = await createProject(req.user!.userId, req.body);
    return sendSuccess(res, project, "Project created", 201);
  } catch (error) {
    throw error;
  }
};

export const getProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const project = await getProjectById(req.user!.userId, String(req.params.id));
    return sendSuccess(res, project);
  } catch (error) {
    throw error;
  }
};

export const patchProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const project = await updateProject(req.user!.userId, String(req.params.id), req.body);
    return sendSuccess(res, project, "Project updated");
  } catch (error) {
    throw error;
  }
};

export const removeProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    await deleteProject(req.user!.userId, String(req.params.id));
    return res.status(204).send();
  } catch (error) {
    throw error;
  }
};
