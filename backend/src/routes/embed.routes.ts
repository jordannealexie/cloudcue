import { Router } from "express";
import { getEmbedMeta } from "../controllers/embedController";

const embedRouter = Router();

embedRouter.get("/embed/meta", getEmbedMeta);

export default embedRouter;