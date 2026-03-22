import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { registerPresenceHandlers } from "./handlers/presenceHandler";
import { setSocketServer } from "./state";

export const configureSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:3000",
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error("Missing JWT secret"));
      }

      const payload = jwt.verify(token, secret) as { userId: string; email: string; name?: string; avatarUrl?: string };
      socket.data.user = {
        userId: payload.userId,
        name: payload.name ?? payload.email,
        avatarUrl: payload.avatarUrl
      };
      socket.join(`user:${payload.userId}`);
      return next();
    } catch (_error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, socket);
  });

  setSocketServer(io);

  return io;
};
