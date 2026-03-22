import { Router } from "express";
import {
  createProjectTask,
  createTaskSchema,
  getTasksByProject,
  patchTask,
  projectTaskParamsSchema,
  removeTask,
  taskIdSchema,
  updateTaskSchema
} from "../controllers/taskController";
import { validate } from "../middleware/validate";

const taskRouter = Router();

taskRouter.get("/projects/:id/tasks", validate(projectTaskParamsSchema, "params"), getTasksByProject);
taskRouter.post("/projects/:id/tasks", validate(projectTaskParamsSchema, "params"), validate(createTaskSchema), createProjectTask);
taskRouter.patch("/tasks/:id", validate(taskIdSchema, "params"), validate(updateTaskSchema), patchTask);
taskRouter.delete("/tasks/:id", validate(taskIdSchema, "params"), removeTask);

export default taskRouter;
