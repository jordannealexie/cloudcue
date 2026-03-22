"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import {
  createProjectThunk,
  deleteProjectThunk,
  fetchProjectByIdThunk,
  fetchProjectsThunk,
  updateProjectThunk
} from "../store/slices/projectsSlice";

export const useProjects = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects);

  const loadProjects = useCallback(() => dispatch(fetchProjectsThunk()), [dispatch]);
  const loadProject = useCallback((id: string) => dispatch(fetchProjectByIdThunk(id)), [dispatch]);
  const createProject = useCallback(
    (payload: { name: string; description?: string; color: string }) => dispatch(createProjectThunk(payload)),
    [dispatch]
  );
  const updateProject = useCallback(
    (payload: { id: string; name?: string; description?: string | null; color?: string }) =>
      dispatch(updateProjectThunk(payload)),
    [dispatch]
  );
  const deleteProject = useCallback((id: string) => dispatch(deleteProjectThunk(id)), [dispatch]);

  return useMemo(
    () => ({
      ...projects,
      loadProjects,
      loadProject,
      createProject,
      updateProject,
      deleteProject
    }),
    [createProject, deleteProject, loadProject, loadProjects, projects, updateProject]
  );
};
