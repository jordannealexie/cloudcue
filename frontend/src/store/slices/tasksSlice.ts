"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { ApiResponse, Task, TaskStatus } from "../../types";

interface TasksState {
  byProjectId: Record<string, Task[]>;
  fetchedAtByProjectId: Record<string, number>;
  loadingByProjectId: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  byProjectId: {},
  fetchedAtByProjectId: {},
  loadingByProjectId: {},
  isLoading: false,
  error: null
};

/** Fetches all tasks for a given project id. */
export const fetchTasksByProjectThunk = createAsyncThunk(
  "tasks/fetchByProject",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`);
      return { projectId, tasks: response.data.data };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to fetch tasks"));
    }
  },
  {
    condition: (projectId, { getState }) => {
      const state = getState() as { tasks: TasksState };

      if (state.tasks.loadingByProjectId[projectId]) {
        return false;
      }

      const hasCachedTasks = Array.isArray(state.tasks.byProjectId[projectId]);
      const fetchedAt = state.tasks.fetchedAtByProjectId[projectId];

      if (!hasCachedTasks || !fetchedAt) {
        return true;
      }

      return Date.now() - fetchedAt > 30_000;
    }
  }
);

/** Creates a task in the selected project. */
export const createTaskThunk = createAsyncThunk(
  "tasks/create",
  async (
    payload: {
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: string;
      assigneeId?: string;
      estimatedHours?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post<ApiResponse<Task>>(`/projects/${payload.projectId}/tasks`, payload);
      return { projectId: payload.projectId, task: response.data.data };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to create task"));
    }
  }
);

/** Persists updates to a task, including drag/drop reorder fields. */
export const updateTaskThunk = createAsyncThunk(
  "tasks/update",
  async (
    payload: {
      id: string;
      projectId: string;
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: string | null;
      assigneeId?: string | null;
      estimatedHours?: number | null;
      position?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${payload.id}`, payload);
      return { projectId: payload.projectId, task: response.data.data };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to update task"));
    }
  }
);

/** Deletes a task by id. */
export const deleteTaskThunk = createAsyncThunk(
  "tasks/delete",
  async (payload: { taskId: string; projectId: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/tasks/${payload.taskId}`);
      return payload;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to delete task"));
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    optimisticMoveTask(
      state,
      action: PayloadAction<{
        projectId: string;
        taskId: string;
        destinationStatus: TaskStatus;
        destinationPosition: number;
      }>
    ) {
      const { projectId, taskId, destinationStatus, destinationPosition } = action.payload;
      const current = state.byProjectId[projectId] ?? [];
      const moving = current.find((task) => task.id === taskId);

      if (!moving) {
        return;
      }

      const remainder = current.filter((task) => task.id !== taskId);
      const targetColumn = remainder
        .filter((task) => task.status === destinationStatus)
        .sort((a, b) => a.position - b.position);

      targetColumn.splice(destinationPosition, 0, {
        ...moving,
        status: destinationStatus,
        position: destinationPosition
      });

      const recomputed = remainder
        .filter((task) => task.status !== destinationStatus)
        .concat(targetColumn.map((task, index) => ({ ...task, position: index })));

      state.byProjectId[projectId] = recomputed;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasksByProjectThunk.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.loadingByProjectId ??= {};
        state.loadingByProjectId[action.meta.arg] = true;
      })
      .addCase(fetchTasksByProjectThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.byProjectId ??= {};
        state.loadingByProjectId ??= {};
        state.fetchedAtByProjectId ??= {};
        state.byProjectId[action.payload.projectId] = action.payload.tasks;
        state.fetchedAtByProjectId[action.payload.projectId] = Date.now();
        state.loadingByProjectId[action.payload.projectId] = false;
      })
      .addCase(fetchTasksByProjectThunk.rejected, (state, action) => {
        state.isLoading = false;
        const projectId = action.meta.arg;
        state.loadingByProjectId ??= {};
        state.loadingByProjectId[projectId] = false;
        state.error = (action.payload as string) ?? "Unable to fetch tasks";
      })
      .addCase(createTaskThunk.fulfilled, (state, action) => {
        state.byProjectId ??= {};
        state.fetchedAtByProjectId ??= {};
        const tasks = state.byProjectId[action.payload.projectId] ?? [];
        state.byProjectId[action.payload.projectId] = [...tasks, action.payload.task];
        state.fetchedAtByProjectId[action.payload.projectId] = Date.now();
      })
      .addCase(createTaskThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to create task";
      })
      .addCase(updateTaskThunk.fulfilled, (state, action) => {
        state.byProjectId ??= {};
        state.fetchedAtByProjectId ??= {};
        const tasks = state.byProjectId[action.payload.projectId] ?? [];
        state.byProjectId[action.payload.projectId] = tasks.map((task) =>
          task.id === action.payload.task.id ? action.payload.task : task
        );
        state.fetchedAtByProjectId[action.payload.projectId] = Date.now();
      })
      .addCase(updateTaskThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to update task";
      })
      .addCase(deleteTaskThunk.fulfilled, (state, action) => {
        state.byProjectId ??= {};
        state.fetchedAtByProjectId ??= {};
        const tasks = state.byProjectId[action.payload.projectId] ?? [];
        state.byProjectId[action.payload.projectId] = tasks.filter(
          (task) => task.id !== action.payload.taskId
        );
        state.fetchedAtByProjectId[action.payload.projectId] = Date.now();
      })
      .addCase(deleteTaskThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to delete task";
      });
  }
});

export const { optimisticMoveTask } = tasksSlice.actions;
export default tasksSlice.reducer;
