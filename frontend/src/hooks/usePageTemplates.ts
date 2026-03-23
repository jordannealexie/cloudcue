"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, getApiErrorMessage } from "../lib/apiClient";
import type { ApiResponse } from "../types";
import type { PageTemplateRecord } from "../types/workspace";

export const usePageTemplates = () => {
  const [items, setItems] = useState<PageTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<ApiResponse<PageTemplateRecord[]>>("/page-templates");
      setItems(response.data.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load page templates"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createTemplate = useCallback(async (payload: { name: string; content: unknown }): Promise<boolean> => {
    try {
      setError(null);
      const response = await apiClient.post<ApiResponse<PageTemplateRecord>>("/page-templates", payload);
      setItems((previous) => [response.data.data, ...previous]);
      return true;
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Unable to create page template"));
      return false;
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      setError(null);
      await apiClient.delete(`/page-templates/${templateId}`);
      setItems((previous) => previous.filter((item) => item.id !== templateId));
      return true;
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete page template"));
      return false;
    }
  }, []);

  return useMemo(
    () => ({ items, isLoading, error, load, createTemplate, deleteTemplate }),
    [createTemplate, deleteTemplate, error, isLoading, items, load]
  );
};
