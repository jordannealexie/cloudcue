export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
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
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  createdAt: string;
  members: ProjectMember[];
  tasks: Task[];
}

export interface DashboardStats {
  totalTasks: number;
  inProgress: number;
  completedToday: number;
  overdue: number;
  weeklyActivity: Array<{ date: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export interface NotificationItem {
  id: string;
  type: "mention" | "task" | "comment" | "system";
  title: string;
  body: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}
