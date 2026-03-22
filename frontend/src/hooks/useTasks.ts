"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import {
  createTaskThunk,
  deleteTaskThunk,
  fetchTasksByProjectThunk,
  optimisticMoveTask,
  updateTaskThunk
} from "../store/slices/tasksSlice";
import type { TaskStatus } from "../types";

export const useTasks = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks);

  const loadTasks = useCallback((projectId: string) => dispatch(fetchTasksByProjectThunk(projectId)), [dispatch]);
  const createTask = useCallback(
    (payload: {
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: string;
      assigneeId?: string;
      estimatedHours?: number;
    }) => dispatch(createTaskThunk(payload)),
    [dispatch]
  );
  const updateTask = useCallback(
    (payload: {
      id: string;
      projectId: string;
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: string | null;
      assigneeId?: string | null;
      estimatedHours?: number | null;
      position?: number;
    }) => dispatch(updateTaskThunk(payload)),
    [dispatch]
  );
  const deleteTask = useCallback(
    (payload: { taskId: string; projectId: string }) => dispatch(deleteTaskThunk(payload)),
    [dispatch]
  );
  const optimisticMove = useCallback(
    (payload: {
      projectId: string;
      taskId: string;
      destinationStatus: TaskStatus;
      destinationPosition: number;
    }) => dispatch(optimisticMoveTask(payload)),
    [dispatch]
  );

  return useMemo(
    () => ({
      ...tasks,
      loadTasks,
      createTask,
      updateTask,
      deleteTask,
      optimisticMove
    }),
    [createTask, deleteTask, loadTasks, optimisticMove, tasks, updateTask]
  );
};
