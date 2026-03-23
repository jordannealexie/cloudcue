import { Router } from "express";
import {
  createPageTemplateSchema,
  createPageSchema,
  deletePage,
  getPage,
  getPagePermissions,
  listPages,
  listTemplates,
  movePageSchema,
  patchMovePage,
  patchPage,
  patchPagePermission,
  patchPermissionSchema,
  permissionsSchema,
  postPage,
  postPagePermission,
  postTemplate,
  removePagePermission,
  removeTemplate,
  restoreArchivedPage,
  searchPageIndex,
  updatePageSchema
} from "../controllers/pageController";
import { checkPagePermission } from "../middleware/checkPagePermission";
import { validate } from "../middleware/validate";

const pageRouter = Router();

pageRouter.get("/pages", listPages);
pageRouter.post("/pages", validate(createPageSchema), postPage);
pageRouter.get("/pages/search", searchPageIndex);
pageRouter.get("/page-templates", listTemplates);
pageRouter.post("/page-templates", validate(createPageTemplateSchema), postTemplate);
pageRouter.delete("/page-templates/:id", removeTemplate);

pageRouter.get("/pages/:id", checkPagePermission("viewer"), getPage);
pageRouter.patch("/pages/:id", checkPagePermission("editor"), validate(updatePageSchema), patchPage);
pageRouter.delete("/pages/:id", checkPagePermission("admin"), deletePage);
pageRouter.post("/pages/:id/restore", checkPagePermission("admin"), restoreArchivedPage);
pageRouter.patch("/pages/:id/move", checkPagePermission("editor"), validate(movePageSchema), patchMovePage);

pageRouter.get("/pages/:id/permissions", checkPagePermission("admin"), getPagePermissions);
pageRouter.post("/pages/:id/permissions", checkPagePermission("admin"), validate(permissionsSchema), postPagePermission);
pageRouter.patch(
  "/pages/:id/permissions/:userId",
  checkPagePermission("admin"),
  validate(patchPermissionSchema),
  patchPagePermission
);
pageRouter.delete("/pages/:id/permissions/:userId", checkPagePermission("admin"), removePagePermission);

export default pageRouter;
