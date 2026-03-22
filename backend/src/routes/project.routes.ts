import { Router } from "express";
import {
  createNewProject,
  createProjectSchema,
  getProject,
  getProjects,
  patchProject,
  projectIdSchema,
  removeProject,
  updateProjectSchema
} from "../controllers/projectController";
import { validate } from "../middleware/validate";

const projectRouter = Router();

projectRouter.get("/", getProjects);
projectRouter.post("/", validate(createProjectSchema), createNewProject);
projectRouter.get("/:id", validate(projectIdSchema, "params"), getProject);
projectRouter.patch("/:id", validate(projectIdSchema, "params"), validate(updateProjectSchema), patchProject);
projectRouter.delete("/:id", validate(projectIdSchema, "params"), removeProject);

export default projectRouter;
