export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimatedHours?: number | null;
  position: number;
  projectId: string;
  assigneeId?: string | null;
  assignee?: TaskUser | null;
  createdAt: string;
  updatedAt: string;
}
