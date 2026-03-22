"use client";

import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import type { Task } from "../../types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const dueText = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";

  return (
    <button
      type="button"
      aria-label={`Open task ${task.title}`}
      onClick={onClick}
      className="surface-elevated w-full p-3 text-left transition hover:border-[var(--border)]"
    >
      <h3 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">{task.title}</h3>
      <div className="mb-3 flex items-center gap-2">
        <Badge className={`priority-${task.priority}`}>{task.priority}</Badge>
        <Badge>{dueText}</Badge>
      </div>
      <div className="flex items-center justify-end">
        <Avatar name={task.assignee?.name ?? "Unassigned"} src={task.assignee?.avatarUrl} size="sm" />
      </div>
    </button>
  );
}
