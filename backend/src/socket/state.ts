import type { Server } from "socket.io";

let ioRef: Server | null = null;

export const setSocketServer = (io: Server) => {
  ioRef = io;
};

export const getSocketServer = () => ioRef;