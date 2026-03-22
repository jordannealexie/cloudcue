"use client";

import { useCallback } from "react";
import { apiClient } from "../lib/apiClient";

export const usePagePermissions = () => {
  const listPermissions = useCallback(async (pageId: string) => {
    const response = await apiClient.get(`/pages/${pageId}/permissions`);
    return response.data.data;
  }, []);

  const grantPermission = useCallback(
    async (pageId: string, payload: { userId: string; role: "viewer" | "editor" | "admin" }) => {
      const response = await apiClient.post(`/pages/${pageId}/permissions`, payload);
      return response.data.data;
    },
    []
  );

  const updatePermissionRole = useCallback(
    async (pageId: string, userId: string, role: "viewer" | "editor" | "admin") => {
      const response = await apiClient.patch(`/pages/${pageId}/permissions/${userId}`, { role });
      return response.data.data;
    },
    []
  );

  const revokePermission = useCallback(async (pageId: string, userId: string) => {
    await apiClient.delete(`/pages/${pageId}/permissions/${userId}`);
  }, []);

  return {
    listPermissions,
    grantPermission,
    updatePermissionRole,
    revokePermission
  };
};
