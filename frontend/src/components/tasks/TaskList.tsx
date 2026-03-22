"use client";

import TaskCard from "./TaskCard";
import type { Task } from "../../types";

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  error?: string | null;
  onTaskClick: (taskId: string) => void;
}

export default function TaskList({ tasks, loading = false, error = null, onTaskClick }: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="surface-elevated h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="surface-card p-4 text-[14px] text-[var(--blush)]">{error}</div>;
  }

  if (tasks.length === 0) {
    return <div className="surface-card p-4 text-[14px] text-[var(--text-secondary)]">No tasks available.</div>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
      ))}
    </div>
  );
}
