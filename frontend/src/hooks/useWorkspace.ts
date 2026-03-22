"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import {
  createPageThunk,
  deletePageThunk,
  fetchPage,
  fetchPageTree,
  movePageThunk,
  searchPagesThunk,
  setCurrentPageId,
  setSearchOpen,
  updatePageThunk
} from "../store/slices/workspaceSlice";

export const useWorkspace = () => {
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) => state.workspace);

  const loadTree = useCallback(() => dispatch(fetchPageTree()), [dispatch]);
  const loadPage = useCallback((pageId: string) => dispatch(fetchPage(pageId)), [dispatch]);
  const createPage = useCallback(
    (payload: { title?: string; emoji?: string; parentId?: string }) => dispatch(createPageThunk(payload)),
    [dispatch]
  );
  const updatePage = useCallback(
    (payload: {
      pageId: string;
      title?: string;
      emoji?: string;
      coverUrl?: string | null;
      content?: unknown;
      contentText?: string;
    }) => dispatch(updatePageThunk(payload)),
    [dispatch]
  );
  const removePage = useCallback((pageId: string) => dispatch(deletePageThunk(pageId)), [dispatch]);
  const movePage = useCallback(
    (payload: { pageId: string; parentId: string | null; position: number }) => dispatch(movePageThunk(payload)),
    [dispatch]
  );
  const searchPages = useCallback((query: string) => dispatch(searchPagesThunk(query)), [dispatch]);

  return useMemo(
    () => ({
      ...workspace,
      loadTree,
      loadPage,
      createPage,
      updatePage,
      removePage,
      movePage,
      searchPages,
      setCurrentPageId: (pageId: string | null) => dispatch(setCurrentPageId(pageId)),
      setSearchOpen: (open: boolean) => dispatch(setSearchOpen(open))
    }),
    [createPage, dispatch, loadPage, loadTree, movePage, removePage, searchPages, updatePage, workspace]
  );
};
