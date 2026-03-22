"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import { getSocketClient } from "../lib/socketClient";
import { setViewers } from "../store/slices/workspaceSlice";
import {
  markCommentResolvedFromSocket,
  removeCommentFromSocket,
  upsertCommentFromSocket
} from "../store/slices/commentsSlice";
import { fetchNotificationsThunk } from "../store/slices/notificationsSlice";
import type { PageComment } from "../types/workspace";

export const useSocket = (pageId?: string) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!token || !pageId) {
      return;
    }

    const socket = getSocketClient(token);
    socket.emit("page:join", { pageId });

    socket.on("page:viewers", (payload: { viewers: Array<{ userId: string; name: string; avatarUrl?: string }> }) => {
      dispatch(setViewers({ pageId, viewers: payload.viewers }));
    });

    socket.on("comment:new", (payload: { comment: PageComment }) => {
      if (payload.comment.pageId === pageId) {
        dispatch(upsertCommentFromSocket({ pageId, comment: payload.comment }));
      }
    });

    socket.on("comment:updated", (payload: { comment: PageComment }) => {
      if (payload.comment.pageId === pageId) {
        dispatch(upsertCommentFromSocket({ pageId, comment: payload.comment }));
      }
    });

    socket.on("comment:deleted", (payload: { commentId: string }) => {
      dispatch(removeCommentFromSocket({ pageId, commentId: payload.commentId }));
    });

    socket.on("comment:resolved", (payload: { commentId: string }) => {
      dispatch(markCommentResolvedFromSocket({ pageId, commentId: payload.commentId }));
    });

    socket.on(
      "mention:received",
      (_payload: { pageId: string; pageTitle: string; commentId: string; fromUser: string }) => {
        void dispatch(fetchNotificationsThunk("all"));
      }
    );

    return () => {
      socket.emit("page:leave", { pageId });
      socket.off("page:viewers");
      socket.off("comment:new");
      socket.off("comment:updated");
      socket.off("comment:deleted");
      socket.off("comment:resolved");
      socket.off("mention:received");
    };
  }, [dispatch, pageId, token]);
};
