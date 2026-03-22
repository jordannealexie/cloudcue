"use client";

import { useEffect, useState } from "react";
import type { ProjectMember, Task, TaskPriority, TaskStatus } from "../../types";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";

interface TaskSlideOverProps {
  task: Task | null;
  projectMembers: ProjectMember[];
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
    estimatedHours?: number | null;
  }) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskSlideOver({ task, projectMembers, open, onClose, onSave, onDelete }: TaskSlideOverProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours?.toString() ?? "");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? "todo");
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.dueDate?.slice(0, 10) ?? "");
    setAssigneeId(task?.assigneeId ?? "");
    setEstimatedHours(task?.estimatedHours?.toString() ?? "");
  }, [task]);

  if (!open || !task) {
    return null;
  }

  return (
    <aside className="overlay-in fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm">
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

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-meta text-[var(--text-secondary)]">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-meta text-[var(--text-secondary)]">Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />

            <Input
              label="Estimated hours"
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(event) => setEstimatedHours(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-meta text-[var(--text-secondary)]">Assignee</span>
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </label>

          <Button
            className="w-full"
            onClick={() =>
              onSave({
                id: task.id,
                title,
                description: description || null,
                status,
                priority,
                dueDate: dueDate || null,
                assigneeId: assigneeId || null,
                estimatedHours: estimatedHours ? Number(estimatedHours) : null
              })
            }
          >
            Save Changes
          </Button>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            Delete Task
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={isDeleteConfirmOpen}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(task.id);
        }}
      />
    </aside>
  );
}
