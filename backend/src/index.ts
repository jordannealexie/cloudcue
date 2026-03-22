import "dotenv/config";
import "express-async-errors";
import "./utils/validateEnv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import type { Request, Response } from "express";
import authRouter from "./routes/auth.routes";
import projectRouter from "./routes/project.routes";
import taskRouter from "./routes/task.routes";
import userRouter from "./routes/user.routes";
import pageRouter from "./routes/page.routes";
import commentRouter from "./routes/comment.routes";
import uploadRouter from "./routes/upload.routes";
import embedRouter from "./routes/embed.routes";
import notificationRouter from "./routes/notification.routes";
import { authenticate } from "./middleware/authenticate";
import { errorHandler } from "./middleware/errorHandler";
import { configureSocketServer } from "./socket";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const httpServer = createServer(app);

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { status: "ok" }
  });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", authenticate, projectRouter);
app.use("/api", authenticate, taskRouter);
app.use("/api", authenticate, userRouter);
app.use("/api", authenticate, pageRouter);
app.use("/api", authenticate, commentRouter);
app.use("/api", authenticate, uploadRouter);
app.use("/api", authenticate, embedRouter);
app.use("/api", authenticate, notificationRouter);

app.use(errorHandler);

configureSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`CloudCue backend listening on port ${port}`);
});
