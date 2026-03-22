"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { ApiResponse, Project } from "../../types";

interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  isLoading: false,
  error: null
};

/** Fetches all projects for the authenticated user. */
export const fetchProjectsThunk = createAsyncThunk("projects/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<ApiResponse<Project[]>>("/projects");
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to fetch projects"));
  }
});

/** Fetches a single project including members and tasks. */
export const fetchProjectByIdThunk = createAsyncThunk(
  "projects/fetchById",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ApiResponse<Project>>(`/projects/${projectId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to fetch project"));
    }
  }
);

/** Creates a new project with selected color and metadata. */
export const createProjectThunk = createAsyncThunk(
  "projects/create",
  async (payload: { name: string; description?: string; color: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ApiResponse<Project>>("/projects", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to create project"));
    }
  }
);

/** Updates project attributes by id. */
export const updateProjectThunk = createAsyncThunk(
  "projects/update",
  async (
    payload: { id: string; name?: string; description?: string | null; color?: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = payload;
      const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, body);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to update project"));
    }
  }
);

/** Deletes a project by id. */
export const deleteProjectThunk = createAsyncThunk(
  "projects/delete",
  async (projectId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      return projectId;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to delete project"));
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjectsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Unable to fetch projects";
      })
      .addCase(fetchProjectByIdThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectByIdThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Unable to fetch project";
      })
      .addCase(createProjectThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createProjectThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to create project";
      })
      .addCase(updateProjectThunk.fulfilled, (state, action) => {
        state.items = state.items.map((project) =>
          project.id === action.payload.id ? action.payload : project
        );
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProjectThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to update project";
      })
      .addCase(deleteProjectThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((project) => project.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProjectThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to delete project";
      });
  }
});

export default projectsSlice.reducer;
