import type { Server } from "socket.io";

export const emitCommentNew = (io: Server, pageId: string, comment: unknown) => {
  io.to(`page:${pageId}`).emit("comment:new", { comment });
};

export const emitCommentUpdated = (io: Server, pageId: string, comment: unknown) => {
  io.to(`page:${pageId}`).emit("comment:updated", { comment });
};

export const emitCommentDeleted = (io: Server, pageId: string, commentId: string) => {
  io.to(`page:${pageId}`).emit("comment:deleted", { commentId });
};

export const emitCommentResolved = (io: Server, pageId: string, commentId: string) => {
  io.to(`page:${pageId}`).emit("comment:resolved", { commentId });
};

export const emitMentionReceived = (
  io: Server,
  userId: string,
  payload: { pageId: string; pageTitle: string; commentId: string; fromUser: string }
) => {
  io.to(`user:${userId}`).emit("mention:received", payload);
};
