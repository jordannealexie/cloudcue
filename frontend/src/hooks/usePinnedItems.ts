"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, getApiErrorMessage } from "../lib/apiClient";
import type { ApiResponse } from "../types";

interface PreferencesPayload {
  pinnedItems?: string[];
}

const MAX_PINNED_ITEMS = 5;
const PINNED_ITEMS_EVENT = "cloudcue:pinned-items-changed";

export const usePinnedItems = () => {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (next: string[]) => {
    setItems(next);
    window.dispatchEvent(new CustomEvent<string[]>(PINNED_ITEMS_EVENT, { detail: next }));
    await apiClient.patch<ApiResponse<{ pinnedItems: string[] }>>("/users/preferences", {
      pinnedItems: next
    } satisfies PreferencesPayload);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<ApiResponse<{ pinnedItems?: string[] }>>("/users/preferences");
        setItems(response.data.data.pinnedItems ?? []);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load pinned items"));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const onPinnedItemsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>;
      if (!Array.isArray(customEvent.detail)) {
        return;
      }

      setItems(customEvent.detail);
    };

    window.addEventListener(PINNED_ITEMS_EVENT, onPinnedItemsChanged as EventListener);
    return () => window.removeEventListener(PINNED_ITEMS_EVENT, onPinnedItemsChanged as EventListener);
  }, []);

  const isPinned = useCallback((itemId: string) => items.includes(itemId), [items]);

  const pin = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (items.includes(itemId)) {
        return true;
      }

      if (items.length >= MAX_PINNED_ITEMS) {
        setError("You can pin up to 5 items");
        return false;
      }

      const next = [itemId, ...items];
      try {
        setError(null);
        await save(next);
        return true;
      } catch (saveError) {
        setError(getApiErrorMessage(saveError, "Unable to pin item"));
        return false;
      }
    },
    [items, save]
  );

  const unpin = useCallback(
    async (itemId: string): Promise<boolean> => {
      const next = items.filter((item) => item !== itemId);
      try {
        setError(null);
        await save(next);
        return true;
      } catch (saveError) {
        setError(getApiErrorMessage(saveError, "Unable to unpin item"));
        return false;
      }
    },
    [items, save]
  );

  const togglePin = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (items.includes(itemId)) {
        return unpin(itemId);
      }

      return pin(itemId);
    },
    [items, pin, unpin]
  );

  const reorder = useCallback(
    async (sourceIndex: number, destinationIndex: number): Promise<boolean> => {
      if (sourceIndex === destinationIndex) {
        return true;
      }

      if (
        sourceIndex < 0 ||
        destinationIndex < 0 ||
        sourceIndex >= items.length ||
        destinationIndex >= items.length
      ) {
        return false;
      }

      const next = [...items];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destinationIndex, 0, moved);

      try {
        setError(null);
        await save(next);
        return true;
      } catch (saveError) {
        setError(getApiErrorMessage(saveError, "Unable to reorder pinned items"));
        return false;
      }
    },
    [items, save]
  );

  return useMemo(
    () => ({
      items,
      maxItems: MAX_PINNED_ITEMS,
      isLoading,
      error,
      isPinned,
      pin,
      unpin,
      togglePin,
      reorder
    }),
    [error, isLoading, isPinned, items, pin, reorder, togglePin, unpin]
  );
};
