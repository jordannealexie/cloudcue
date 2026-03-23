"use client";

import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import type { Task } from "../../types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  dragging?: boolean;
}

export default function TaskCard({ task, onClick, dragging = false }: TaskCardProps) {
  const dueText = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";

  return (
    <button
      type="button"
      aria-label={`Open task ${task.title}`}
      onClick={onClick}
      className={`surface-elevated w-full p-3 text-left transition hover:border-[var(--border)] ${dragging ? "rotate-[1deg] border-[var(--accent)] shadow-lg" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">{task.title}</h3>
        <span className="rounded-md border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
          Drag
        </span>
      </div>
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
