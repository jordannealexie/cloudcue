"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient, getApiErrorMessage, setAccessToken } from "../../lib/apiClient";
import type { ApiResponse, User } from "../../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null
};

/** Registers a user account and returns profile plus access token. */
export const registerThunk = createAsyncThunk(
  "auth/register",
  async (payload: { email: string; name: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/register", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Registration failed"));
    }
  }
);

/** Authenticates with email/password and returns profile plus access token. */
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Login failed"));
    }
  }
);

/** Uses refresh cookie to issue a new access token. */
export const refreshAccessTokenThunk = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ApiResponse<{ accessToken: string }>>("/auth/refresh");
      return response.data.data.accessToken;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to refresh session"));
    }
  }
);

/** Fetches the authenticated user profile. */
export const fetchMeThunk = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<ApiResponse<User>>("/users/me");
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to load profile"));
  }
});

/** Clears backend refresh cookie and token state. */
export const logoutThunk = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await apiClient.post("/auth/logout");
    return true;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to logout"));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setSession(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      setAccessToken(action.payload.accessToken);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAccessToken(action.payload.accessToken);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Registration failed";
      })
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAccessToken(action.payload.accessToken);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Login failed";
      })
      .addCase(refreshAccessTokenThunk.fulfilled, (state, action) => {
        state.accessToken = action.payload;
        setAccessToken(action.payload);
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.error = null;
        setAccessToken(null);
      });
  }
});

export const { clearAuthError, setSession } = authSlice.actions;
export default authSlice.reducer;
