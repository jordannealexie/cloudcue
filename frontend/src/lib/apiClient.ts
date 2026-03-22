"use client";

import axios, { AxiosError } from "axios";
import type { ApiResponse } from "../types";

let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const setRefreshHandler = (handler: () => Promise<string | null>): void => {
  refreshHandler = handler;
};

const databaseUnavailableMessage =
  "CloudCue cannot reach the database right now. Start PostgreSQL and try again.";

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiResponse<null>>;
  const status = axiosError.response?.status;
  const message = axiosError.response?.data?.message;

  if (status === 503 || message === "Database is unavailable") {
    return databaseUnavailableMessage;
  }

  return message ?? fallback;
};

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<null>>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest?._retry && refreshHandler) {
      originalRequest._retry = true;
      const refreshed = await refreshHandler();

      if (refreshed && originalRequest?.headers) {
        originalRequest.headers.Authorization = `Bearer ${refreshed}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
