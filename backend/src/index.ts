import "dotenv/config";
import "express-async-errors";
import "./utils/validateEnv";
import { createServer } from "http";
import { startLocalFallbackSyncJob } from "./services/uploadService";
import { configureSocketServer } from "./socket";
import { app } from "./app";

const port = Number(process.env.PORT ?? 4000);
const httpServer = createServer(app);

configureSocketServer(httpServer);

if (!process.env.VERCEL) {
  startLocalFallbackSyncJob();
}

httpServer.listen(port, () => {
  console.log(`CloudCue backend listening on port ${port}`);
});
