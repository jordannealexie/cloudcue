"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, getApiErrorMessage } from "../lib/apiClient";
import type { ApiResponse } from "../types";
import type { PageTemplateRecord } from "../types/workspace";
import { useAppSelector } from "./useAppStore";

const LOCAL_TEMPLATES_KEY = "cloudcue-page-templates";

const readLocalTemplates = (): PageTemplateRecord[] => {
  try {
    const raw = window.localStorage.getItem(LOCAL_TEMPLATES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PageTemplateRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalTemplates = (items: PageTemplateRecord[]) => {
  window.localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(items));
};

export const usePageTemplates = (options?: { autoLoad?: boolean }) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [items, setItems] = useState<PageTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const autoLoad = options?.autoLoad ?? true;

  const load = useCallback(async () => {
    if (!accessToken) {
      setItems(readLocalTemplates());
      setUsingLocalFallback(true);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<ApiResponse<PageTemplateRecord[]>>("/page-templates");
      setItems(response.data.data);
      setUsingLocalFallback(false);
    } catch (loadError) {
      setItems(readLocalTemplates());
      setUsingLocalFallback(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    void load();
  }, [autoLoad, load]);

  const createTemplate = useCallback(async (payload: { name: string; content: unknown }): Promise<boolean> => {
    if (usingLocalFallback || !accessToken) {
      const now = new Date().toISOString();
      const nextItem: PageTemplateRecord = {
        id: crypto.randomUUID(),
        userId: "local-user",
        name: payload.name,
        content: payload.content,
        createdAt: now,
        updatedAt: now
      };

      const next = [nextItem, ...items];
      setItems(next);
      writeLocalTemplates(next);
      return true;
    }

    try {
      setError(null);
      const response = await apiClient.post<ApiResponse<PageTemplateRecord>>("/page-templates", payload);
      setItems((previous) => [response.data.data, ...previous]);
      return true;
    } catch (createError) {
      const fallbackError = getApiErrorMessage(createError, "Unable to create page template");
      if (fallbackError.toLowerCase().includes("template")) {
        const now = new Date().toISOString();
        const nextItem: PageTemplateRecord = {
          id: crypto.randomUUID(),
          userId: "local-user",
          name: payload.name,
          content: payload.content,
          createdAt: now,
          updatedAt: now
        };

        const next = [nextItem, ...items];
        setItems(next);
        writeLocalTemplates(next);
        setUsingLocalFallback(true);
        setError(null);
        return true;
      }

      setError(fallbackError);
      return false;
    }
  }, [accessToken, items, usingLocalFallback]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    if (usingLocalFallback || !accessToken) {
      const next = items.filter((item) => item.id !== templateId);
      setItems(next);
      writeLocalTemplates(next);
      return true;
    }

    try {
      setError(null);
      await apiClient.delete(`/page-templates/${templateId}`);
      setItems((previous) => previous.filter((item) => item.id !== templateId));
      return true;
    } catch (deleteError) {
      const next = items.filter((item) => item.id !== templateId);
      setItems(next);
      writeLocalTemplates(next);
      setUsingLocalFallback(true);
      setError(null);
      return true;
    }
  }, [accessToken, items, usingLocalFallback]);

  return useMemo(
    () => ({ items, isLoading, error, load, createTemplate, deleteTemplate, usingLocalFallback }),
    [createTemplate, deleteTemplate, error, isLoading, items, load, usingLocalFallback]
  );
};
