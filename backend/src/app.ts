import "dotenv/config";
import "express-async-errors";
import "./utils/validateEnv";
import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import authRouter from "./routes/auth.routes";
import projectRouter from "./routes/project.routes";
import taskRouter from "./routes/task.routes";
import userRouter from "./routes/user.routes";
import pageRouter from "./routes/page.routes";
import commentRouter from "./routes/comment.routes";
import uploadRouter, { uploadPublicRouter } from "./routes/upload.routes";
import embedRouter from "./routes/embed.routes";
import notificationRouter from "./routes/notification.routes";
import { authenticate } from "./middleware/authenticate";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./services/prisma";
import { checkStorageHealth } from "./services/uploadService";

export const app = express();

const localStorageDir = path.resolve(process.cwd(), "storage", "uploads");
const corsOrigin = process.env.CLIENT_URL ?? true;

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.options("*", cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/local-files", express.static(localStorageDir));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { service: "cloudcue-backend", status: "ok" }
  });
});

app.get("/favicon.ico", (_req: Request, res: Response) => {
  res.status(204).end();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { status: "ok" }
  });
});

app.get("/api/health/dependencies", async (_req: Request, res: Response) => {
  let database = false;
  let storage = false;

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    database = true;
  } catch {
    database = false;
  }

  storage = await checkStorageHealth();

  const healthy = database && storage;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? "ok" : "degraded",
      dependencies: {
        database,
        storage
      }
    }
  });
});

app.use("/api/auth", authRouter);
app.use("/api", uploadPublicRouter);
app.use("/api/projects", authenticate, projectRouter);
app.use("/api", authenticate, taskRouter);
app.use("/api", authenticate, userRouter);
app.use("/api", authenticate, pageRouter);
app.use("/api", authenticate, commentRouter);
app.use("/api", authenticate, uploadRouter);
app.use("/api", authenticate, embedRouter);
app.use("/api", authenticate, notificationRouter);

app.use(errorHandler);
