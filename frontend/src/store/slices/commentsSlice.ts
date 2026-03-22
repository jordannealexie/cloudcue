"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { PageComment } from "../../types/workspace";

interface CommentsState {
  byPageId: Record<string, PageComment[]>;
  isCommentPanelOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  byPageId: {},
  isCommentPanelOpen: false,
  isLoading: false,
  error: null
};

export const fetchCommentsThunk = createAsyncThunk("comments/fetch", async (pageId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/pages/${pageId}/comments`);
    return { pageId, comments: response.data.data as PageComment[] };
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to load comments"));
  }
});

export const postCommentThunk = createAsyncThunk(
  "comments/post",
  async (payload: { pageId: string; content: string; parentId?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/pages/${payload.pageId}/comments`, payload);
      return { pageId: payload.pageId, comment: response.data.data as PageComment };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to post comment"));
    }
  }
);

export const editCommentThunk = createAsyncThunk(
  "comments/edit",
  async (payload: { commentId: string; pageId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/comments/${payload.commentId}`, { content: payload.content });
      return { pageId: payload.pageId, comment: response.data.data as PageComment };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to edit comment"));
    }
  }
);

export const deleteCommentThunk = createAsyncThunk(
  "comments/delete",
  async (payload: { commentId: string; pageId: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/comments/${payload.commentId}`);
      return payload;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to delete comment"));
    }
  }
);

export const resolveCommentThunk = createAsyncThunk(
  "comments/resolve",
  async (payload: { commentId: string; pageId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/comments/${payload.commentId}/resolve`);
      return { pageId: payload.pageId, comment: response.data.data as PageComment };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to resolve comment"));
    }
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setCommentPanelOpen(state, action: PayloadAction<boolean>) {
      state.isCommentPanelOpen = action.payload;
    },
    upsertCommentFromSocket(state, action: PayloadAction<{ pageId: string; comment: PageComment }>) {
      const existing = state.byPageId[action.payload.pageId] ?? [];
      const index = existing.findIndex((comment) => comment.id === action.payload.comment.id);

      if (index >= 0) {
        existing[index] = action.payload.comment;
        state.byPageId[action.payload.pageId] = [...existing];
      } else {
        state.byPageId[action.payload.pageId] = [action.payload.comment, ...existing];
      }
    },
    removeCommentFromSocket(state, action: PayloadAction<{ pageId: string; commentId: string }>) {
      const existing = state.byPageId[action.payload.pageId] ?? [];
      state.byPageId[action.payload.pageId] = existing.filter((comment) => comment.id !== action.payload.commentId);
    },
    markCommentResolvedFromSocket(state, action: PayloadAction<{ pageId: string; commentId: string }>) {
      const existing = state.byPageId[action.payload.pageId] ?? [];
      state.byPageId[action.payload.pageId] = existing.map((comment) =>
        comment.id === action.payload.commentId
          ? {
              ...comment,
              resolvedAt: new Date().toISOString()
            }
          : comment
      );
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommentsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.byPageId[action.payload.pageId] = action.payload.comments;
      })
      .addCase(fetchCommentsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Unable to load comments";
      })
      .addCase(postCommentThunk.fulfilled, (state, action) => {
        const existing = state.byPageId[action.payload.pageId] ?? [];
        state.byPageId[action.payload.pageId] = [action.payload.comment, ...existing];
      })
      .addCase(postCommentThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to post comment";
      })
      .addCase(editCommentThunk.fulfilled, (state, action) => {
        const comments = state.byPageId[action.payload.pageId] ?? [];
        state.byPageId[action.payload.pageId] = comments.map((comment) =>
          comment.id === action.payload.comment.id ? action.payload.comment : comment
        );
      })
      .addCase(editCommentThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to edit comment";
      })
      .addCase(deleteCommentThunk.fulfilled, (state, action) => {
        const comments = state.byPageId[action.payload.pageId] ?? [];
        state.byPageId[action.payload.pageId] = comments.filter(
          (comment) => comment.id !== action.payload.commentId
        );
      })
      .addCase(deleteCommentThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to delete comment";
      })
      .addCase(resolveCommentThunk.fulfilled, (state, action) => {
        const comments = state.byPageId[action.payload.pageId] ?? [];
        state.byPageId[action.payload.pageId] = comments.map((comment) =>
          comment.id === action.payload.comment.id ? action.payload.comment : comment
        );
      })
      .addCase(resolveCommentThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to resolve comment";
      });
  }
});

export const {
  setCommentPanelOpen,
  upsertCommentFromSocket,
  removeCommentFromSocket,
  markCommentResolvedFromSocket
} = commentsSlice.actions;
export default commentsSlice.reducer;
