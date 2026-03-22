"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { ApiResponse, NotificationItem } from "../../types";

interface NotificationsState {
  items: NotificationItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  isLoading: false,
  error: null
};

export const fetchNotificationsThunk = createAsyncThunk(
  "notifications/fetch",
  async (
    filter: "all" | "unread" | "mentions" | "tasks" | "comments" | "system" = "all",
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.get<ApiResponse<NotificationItem[]>>(`/notifications?filter=${filter}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to load notifications"));
    }
  }
);

export const markNotificationReadThunk = createAsyncThunk(
  "notifications/markRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to mark notification as read"));
    }
  }
);

export const markAllNotificationsReadThunk = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.patch("/notifications/read-all");
      return true;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to mark all as read"));
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Unable to load notifications";
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(markNotificationReadThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to mark notification as read";
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, readAt: new Date().toISOString() }));
      })
      .addCase(markAllNotificationsReadThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to mark all as read";
      });
  }
});

export default notificationsSlice.reducer;
