import type { Server, Socket } from "socket.io";

type Viewer = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
};

const viewersByPage = new Map<string, Map<string, Viewer>>();

export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  socket.on("page:join", ({ pageId }: { pageId: string }) => {
    const user = socket.data.user as Viewer | undefined;
    if (!user) {
      return;
    }

    socket.join(`page:${pageId}`);

    if (!viewersByPage.has(pageId)) {
      viewersByPage.set(pageId, new Map<string, Viewer>());
    }

    viewersByPage.get(pageId)!.set(user.userId, user);
    io.to(`page:${pageId}`).emit("page:viewers", {
      viewers: Array.from(viewersByPage.get(pageId)!.values())
    });
  });

  socket.on("page:leave", ({ pageId }: { pageId: string }) => {
    const user = socket.data.user as Viewer | undefined;
    if (!user) {
      return;
    }

    socket.leave(`page:${pageId}`);
    viewersByPage.get(pageId)?.delete(user.userId);
    io.to(`page:${pageId}`).emit("page:viewers", {
      viewers: Array.from(viewersByPage.get(pageId)?.values() ?? [])
    });
  });
};
