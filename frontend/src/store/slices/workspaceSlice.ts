"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { PageSearchResult, PageTreeNode, Viewer, WorkspacePage } from "../../types/workspace";

interface WorkspaceState {
  pages: Record<string, WorkspacePage>;
  pageTree: PageTreeNode[];
  currentPageId: string | null;
  viewers: Record<string, Viewer[]>;
  searchResults: PageSearchResult[];
  isSearchOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
}

const initialState: WorkspaceState = {
  pages: {},
  pageTree: [],
  currentPageId: null,
  viewers: {},
  searchResults: [],
  isSearchOpen: false,
  isLoading: false,
  isSaving: false,
  saveError: null
};

const buildTree = (pages: WorkspacePage[]): PageTreeNode[] => {
  const map = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  for (const page of pages) {
    map.set(page.id, {
      id: page.id,
      title: page.title,
      emoji: page.emoji,
      parentId: page.parentId ?? null,
      position: page.position,
      children: []
    });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (nodes: PageTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
    nodes.forEach((node) => sortRecursive(node.children));
  };

  sortRecursive(roots);
  return roots;
};

export const fetchPageTree = createAsyncThunk("workspace/fetchPageTree", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/pages");
    return response.data.data as WorkspacePage[];
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to load workspace pages"));
  }
});

export const fetchPage = createAsyncThunk("workspace/fetchPage", async (pageId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/pages/${pageId}`);
    return response.data.data as WorkspacePage;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to load page"));
  }
});

export const createPageThunk = createAsyncThunk(
  "workspace/createPage",
  async (payload: { title?: string; emoji?: string; parentId?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/pages", payload);
      return response.data.data as WorkspacePage;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to create page"));
    }
  }
);

export const updatePageThunk = createAsyncThunk(
  "workspace/updatePage",
  async (payload: {
    pageId: string;
    title?: string;
    emoji?: string;
    coverUrl?: string | null;
    content?: unknown;
    contentText?: string;
  }, { rejectWithValue }) => {
    try {
      const { pageId, ...body } = payload;
      const response = await apiClient.patch(`/pages/${pageId}`, body);
      return response.data.data as WorkspacePage;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to save page"));
    }
  }
);

export const deletePageThunk = createAsyncThunk("workspace/deletePage", async (pageId: string, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/pages/${pageId}`);
    return pageId;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to delete page"));
  }
});

export const movePageThunk = createAsyncThunk(
  "workspace/movePage",
  async (payload: { pageId: string; parentId: string | null; position: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/pages/${payload.pageId}/move`, payload);
      return response.data.data as WorkspacePage;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Unable to move page"));
    }
  }
);

export const searchPagesThunk = createAsyncThunk("workspace/searchPages", async (query: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/pages/search?q=${encodeURIComponent(query)}`);
    return response.data.data as PageSearchResult[];
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Unable to search pages"));
  }
});

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setCurrentPageId(state, action: PayloadAction<string | null>) {
      state.currentPageId = action.payload;
    },
    setViewers(state, action: PayloadAction<{ pageId: string; viewers: Viewer[] }>) {
      state.viewers[action.payload.pageId] = action.payload.viewers;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.isSearchOpen = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPageTree.pending, (state) => {
        state.isLoading = true;
        state.saveError = null;
      })
      .addCase(fetchPageTree.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pages = action.payload.reduce<Record<string, WorkspacePage>>((acc, page) => {
          acc[page.id] = page;
          return acc;
        }, {});
        state.pageTree = buildTree(action.payload);
      })
      .addCase(fetchPageTree.rejected, (state, action) => {
        state.isLoading = false;
        state.saveError = (action.payload as string) ?? "Unable to load workspace pages";
      })
      .addCase(fetchPage.fulfilled, (state, action) => {
        state.pages[action.payload.id] = action.payload;
        state.currentPageId = action.payload.id;
      })
      .addCase(fetchPage.rejected, (state, action) => {
        state.saveError = (action.payload as string) ?? "Unable to load page";
      })
      .addCase(createPageThunk.fulfilled, (state, action) => {
        state.pages[action.payload.id] = action.payload;
        state.pageTree = buildTree(Object.values(state.pages));
      })
      .addCase(createPageThunk.rejected, (state, action) => {
        state.saveError = (action.payload as string) ?? "Unable to create page";
      })
      .addCase(updatePageThunk.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(updatePageThunk.fulfilled, (state, action) => {
        state.isSaving = false;
        state.pages[action.payload.id] = action.payload;
        state.pageTree = buildTree(Object.values(state.pages));
      })
      .addCase(updatePageThunk.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = (action.payload as string) ?? "Unable to save";
      })
      .addCase(deletePageThunk.fulfilled, (state, action) => {
        delete state.pages[action.payload];
        state.pageTree = buildTree(Object.values(state.pages));
      })
      .addCase(deletePageThunk.rejected, (state, action) => {
        state.saveError = (action.payload as string) ?? "Unable to delete page";
      })
      .addCase(movePageThunk.fulfilled, (state, action) => {
        state.pages[action.payload.id] = action.payload;
        state.pageTree = buildTree(Object.values(state.pages));
      })
      .addCase(movePageThunk.rejected, (state, action) => {
        state.saveError = (action.payload as string) ?? "Unable to move page";
      })
      .addCase(searchPagesThunk.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(searchPagesThunk.rejected, (state, action) => {
        state.saveError = (action.payload as string) ?? "Unable to search pages";
      });
  }
});

export const { setCurrentPageId, setSearchOpen, setViewers } = workspaceSlice.actions;
export default workspaceSlice.reducer;
