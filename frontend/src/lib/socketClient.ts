"use client";

import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getSocketClient = (token: string): Socket => {
  if (!socketInstance) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const origin = apiBase.replace(/\/api$/, "");

    socketInstance = io(origin, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: {
        token
      }
    });
  }

  return socketInstance;
};

export const closeSocketClient = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
