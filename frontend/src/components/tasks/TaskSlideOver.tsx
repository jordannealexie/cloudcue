"use client";

import { useEffect, useState } from "react";
import type { Task } from "../../types";
import Input from "../ui/Input";
import Button from "../ui/Button";

interface TaskSlideOverProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: { id: string; title: string; description?: string | null }) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskSlideOver({ task, open, onClose, onSave, onDelete }: TaskSlideOverProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
  }, [task]);

  if (!open || !task) {
    return null;
  }

  return (
    <aside className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm">
      <div className="mobile-sheet panel-in absolute bottom-0 right-0 h-full w-full border-l border-[var(--border-subtle)] bg-[var(--bg-modal)] p-6 md:w-[520px] md:rounded-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold">Task details</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <label className="flex flex-col gap-2">
            <span className="text-meta text-[var(--text-secondary)]">Description</span>
            <textarea
              aria-label="Task description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write a description..."
              className="h-36 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] p-3 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>

          <Button
            className="w-full"
            onClick={() => onSave({ id: task.id, title, description: description || null })}
          >
            Save Changes
          </Button>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              const shouldDelete = window.confirm("Are you sure you want to delete this task?");
              if (!shouldDelete) {
                return;
              }

              onDelete(task.id);
            }}
          >
            Delete Task
          </Button>
        </div>
      </div>
    </aside>
  );
}
