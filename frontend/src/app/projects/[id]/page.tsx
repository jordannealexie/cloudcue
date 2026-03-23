"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import PageWrapper from "../../../components/layout/PageWrapper";
import Topbar from "../../../components/layout/Topbar";
import TaskBoard from "../../../components/tasks/TaskBoard";
import TaskList from "../../../components/tasks/TaskList";
import TaskSlideOver from "../../../components/tasks/TaskSlideOver";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import { PROJECT_SWATCHES } from "../../../lib/constants";
import { useProjects } from "../../../hooks/useProjects";
import { useTasks } from "../../../hooks/useTasks";
import { useAppDispatch } from "../../../hooks/useAppStore";
import { setToast } from "../../../store/slices/uiSlice";
import confetti from "canvas-confetti";
import type { Task, TaskPriority, TaskStatus } from "../../../types";

export default function ProjectDetailPage() {
    const dispatch = useAppDispatch();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;
  const { currentProject, loadProject, updateProject, deleteProject, isLoading: projectLoading, error: projectError } = useProjects();
  const {
    byProjectId,
    isLoading: tasksLoading,
    error: tasksError,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    optimisticMove
  } = useTasks();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<string>("");
  const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [isDeleteProjectConfirmOpen, setIsDeleteProjectConfirmOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [hasCelebratedCompletion, setHasCelebratedCompletion] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectColor, setEditProjectColor] = useState("#3D5387");
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!currentProject) {
      return;
    }

    setEditProjectName(currentProject.name);
    setEditProjectDescription(currentProject.description ?? "");
    setEditProjectColor(currentProject.color);
  }, [currentProject]);

  useEffect(() => {
    if (projectId && currentProject?.id !== projectId) {
      void loadProject(projectId);
    }

    if (projectId && !byProjectId[projectId]) {
      void loadTasks(projectId);
    }
  }, [byProjectId, currentProject?.id, loadProject, loadTasks, projectId]);

  const tasks = useMemo(() => byProjectId[projectId] ?? currentProject?.tasks ?? [], [byProjectId, currentProject?.tasks, projectId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const assigneeMatch = assigneeFilter === "all" || task.assigneeId === assigneeFilter;
      const dueMatch = !dueFilter || (task.dueDate ?? "").slice(0, 10) === dueFilter;
      return priorityMatch && assigneeMatch && dueMatch;
    });
  }, [assigneeFilter, dueFilter, priorityFilter, tasks]);

  useEffect(() => {
    const allDone = tasks.length > 0 && tasks.every((task) => task.status === "done");
    if (!allDone && hasCelebratedCompletion) {
      setHasCelebratedCompletion(false);
    }
  }, [hasCelebratedCompletion, tasks]);

  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? null;

  const calendarCells = useMemo(() => {
    const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startWeekday = startDay.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days: Array<{ date: Date; key: string; tasks: Task[]; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      const date = new Date(startDay);
      date.setDate(date.getDate() - (startWeekday - i));
      const key = date.toISOString().slice(0, 10);
      days.push({ date, key, tasks: [], isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const key = date.toISOString().slice(0, 10);
      const dayTasks = filteredTasks.filter((task) => (task.dueDate ?? "").slice(0, 10) === key);
      days.push({ date, key, tasks: dayTasks, isCurrentMonth: true });
    }

    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const date = new Date(last);
      date.setDate(date.getDate() + 1);
      const key = date.toISOString().slice(0, 10);
      days.push({ date, key, tasks: [], isCurrentMonth: false });
    }

    return days;
  }, [currentMonth, filteredTasks]);

  const handleAddTask = async (status: TaskStatus): Promise<void> => {
    const result = await createTask({
      projectId,
      status,
      title: "New Task",
      priority: "medium"
    });

    if (result.meta.requestStatus === "fulfilled") {
      setMutationMessage("Task added.");
    } else {
      setMutationMessage((result.payload as string) ?? "Unable to add task.");
    }
  };

  const handleCreateTaskFromModal = async (): Promise<void> => {
    const title = newTaskTitle.trim();

    if (!title) {
      setMutationMessage("Task title is required.");
      return;
    }

    const result = await createTask({
      projectId,
      title,
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority,
      status: newTaskStatus,
      dueDate: newTaskDueDate || undefined,
      assigneeId: newTaskAssigneeId || undefined
    });

    if (result.meta.requestStatus === "fulfilled") {
      setMutationMessage("Task created.");
      setIsCreateTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskStatus("todo");
      setNewTaskDueDate("");
      setNewTaskAssigneeId("");
      return;
    }

    setMutationMessage((result.payload as string) ?? "Unable to create task.");
  };

  const handleReorder = async (payload: {
    taskId: string;
    destinationStatus: TaskStatus;
    destinationPosition: number;
  }): Promise<void> => {
    const projectedTasks = tasks.map((task) =>
      task.id === payload.taskId
        ? { ...task, status: payload.destinationStatus, position: payload.destinationPosition }
        : task
    );
    const allDoneAfterMove = projectedTasks.length > 0 && projectedTasks.every((task) => task.status === "done");

    optimisticMove({
      projectId,
      taskId: payload.taskId,
      destinationStatus: payload.destinationStatus,
      destinationPosition: payload.destinationPosition
    });

    const result = await updateTask({
      id: payload.taskId,
      projectId,
      status: payload.destinationStatus,
      position: payload.destinationPosition
    });

    if (result.meta.requestStatus === "fulfilled") {
      if (allDoneAfterMove && !hasCelebratedCompletion) {
        confetti({
          particleCount: 90,
          spread: 72,
          origin: { y: 0.72 }
        });
        dispatch(setToast({ message: "Project complete! 🎉", type: "success" }));
        setHasCelebratedCompletion(true);
      }

      setMutationMessage(null);
      return;
    }

    await loadTasks(projectId);
    setMutationMessage((result.payload as string) ?? "Task move failed. Board refreshed.");
  };

  const handleSaveTask = async (payload: {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
    estimatedHours?: number | null;
  }): Promise<void> => {
    const result = await updateTask({
      id: payload.id,
      projectId,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status,
      priority: payload.priority,
      dueDate: payload.dueDate,
      assigneeId: payload.assigneeId,
      estimatedHours: payload.estimatedHours
    });

    if (result.meta.requestStatus === "fulfilled") {
      setMutationMessage("Task updated.");
      setSelectedTaskId(null);
    } else {
      setMutationMessage((result.payload as string) ?? "Unable to update task.");
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    const result = await deleteTask({ taskId, projectId });

    if (result.meta.requestStatus === "fulfilled") {
      setMutationMessage("Task deleted.");
      setSelectedTaskId(null);
      return;
    }

    setMutationMessage((result.payload as string) ?? "Unable to delete task.");
  };

  const handleDeleteProject = async (): Promise<void> => {
    const result = await deleteProject(projectId);

    if (result.meta.requestStatus === "fulfilled") {
      router.push("/projects");
      return;
    }

    setMutationMessage((result.payload as string) ?? "Unable to delete project.");
  };

  const handleUpdateProject = async (): Promise<void> => {
    const name = editProjectName.trim();

    if (!name) {
      setMutationMessage("Project name is required.");
      return;
    }

    const result = await updateProject({
      id: projectId,
      name,
      description: editProjectDescription.trim() || null,
      color: editProjectColor
    });

    if (result.meta.requestStatus === "fulfilled") {
      setMutationMessage("Project updated.");
      setIsEditProjectOpen(false);
      return;
    }

    setMutationMessage((result.payload as string) ?? "Unable to update project.");
  };

  return (
    <PageWrapper>
      <Topbar />

      <section className="mb-4 surface-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold">{projectLoading ? "Loading project..." : currentProject?.name ?? "Project"}</h1>
            <p className="text-[14px] text-[var(--text-secondary)]">{currentProject?.description ?? "All the work your team is running."}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateTaskOpen(true)}>+ New Task</Button>
            <Button variant="secondary" onClick={() => setIsEditProjectOpen(true)}>Edit Project</Button>
            <Button variant="danger" onClick={() => setIsDeleteProjectConfirmOpen(true)}>Delete Project</Button>
          </div>
        </div>
      </section>

      {projectError ? <div className="mb-4 surface-card p-4 text-[var(--blush)]">{projectError}</div> : null}
      {mutationMessage ? <div className="mb-4 surface-card p-3 text-[12px] text-[var(--text-secondary)]">{mutationMessage}</div> : null}

      <section className="mb-4 surface-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="text-meta text-[var(--text-secondary)]">Priority</label>
          <select
            aria-label="Filter by priority"
            className="mt-1 h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | "all")}
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="text-meta text-[var(--text-secondary)]">Assignee</label>
          <select
            aria-label="Filter by assignee"
            className="mt-1 h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
          >
            <option value="all">All assignees</option>
            {(currentProject?.members ?? []).map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
        <Input label="Due Date" type="date" value={dueFilter} onChange={(event) => setDueFilter(event.target.value)} />
        <div className="flex items-end gap-2">
          <Button variant={view === "kanban" ? "primary" : "secondary"} onClick={() => setView("kanban")} className="flex-1">
            Board
          </Button>
          <Button variant={view === "list" ? "primary" : "secondary"} onClick={() => setView("list")} className="flex-1">
            List
          </Button>
          <Button variant={view === "calendar" ? "primary" : "secondary"} onClick={() => setView("calendar")} className="flex-1">
            Calendar
          </Button>
        </div>
        </div>
      </section>

      {view === "kanban" ? (
        <TaskBoard
          tasks={filteredTasks}
          loading={tasksLoading}
          error={tasksError}
          onTaskClick={setSelectedTaskId}
          onAddTask={handleAddTask}
          onReorder={handleReorder}
        />
      ) : view === "list" ? (
        <TaskList tasks={filteredTasks as Task[]} loading={tasksLoading} error={tasksError} onTaskClick={setSelectedTaskId} />
      ) : (
        <section className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              Previous
            </Button>
            <h3 className="text-[16px] font-semibold">
              {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h3>
            <Button
              variant="secondary"
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-[11px] text-[var(--text-secondary)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <p key={day} className="px-2 py-1 text-center">{day}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => (
              <div
                key={cell.key}
                className={`min-h-[100px] rounded-lg border border-[var(--border-subtle)] p-2 ${
                  cell.isCurrentMonth ? "bg-[var(--bg-card)]" : "bg-[var(--bg-card-2)]"
                }`}
              >
                <p className="mb-1 text-[11px] text-[var(--text-secondary)]">{cell.date.getDate()}</p>
                <div className="space-y-1">
                  {cell.tasks.slice(0, 2).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full rounded bg-[var(--accent)]/20 px-2 py-1 text-left text-[11px]"
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TaskSlideOver
        task={selectedTask}
        projectMembers={currentProject?.members ?? []}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onSave={handleSaveTask}
        onDelete={(taskId) => void handleDeleteTask(taskId)}
      />

      <Modal open={isEditProjectOpen} onClose={() => setIsEditProjectOpen(false)} title="Edit Project">
        <div className="space-y-3">
          <Input label="Name" value={editProjectName} onChange={(event) => setEditProjectName(event.target.value)} />
          <Input
            label="Description"
            value={editProjectDescription}
            onChange={(event) => setEditProjectDescription(event.target.value)}
          />
          <div>
            <p className="mb-2 text-meta text-[var(--text-secondary)]">Color</p>
            <div className="grid grid-cols-5 gap-2">
              {PROJECT_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Select ${swatch}`}
                  onClick={() => setEditProjectColor(swatch)}
                  className={`h-10 rounded-lg border transition ${
                    editProjectColor === swatch
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-card)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={() => void handleUpdateProject()}>Save Project</Button>
        </div>
      </Modal>

      <Modal open={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} title="Create Task">
        <div className="space-y-3">
          <Input label="Title" value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Task title" />
          <Input label="Description" value={newTaskDescription} onChange={(event) => setNewTaskDescription(event.target.value)} placeholder="Optional details" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-meta text-[var(--text-secondary)]">Priority</span>
              <select
                value={newTaskPriority}
                onChange={(event) => setNewTaskPriority(event.target.value as TaskPriority)}
                className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-meta text-[var(--text-secondary)]">Status</span>
              <select
                value={newTaskStatus}
                onChange={(event) => setNewTaskStatus(event.target.value as TaskStatus)}
                className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>
          <Input label="Due date" type="date" value={newTaskDueDate} onChange={(event) => setNewTaskDueDate(event.target.value)} />
          <label className="flex flex-col gap-2">
            <span className="text-meta text-[var(--text-secondary)]">Assignee</span>
            <select
              value={newTaskAssigneeId}
              onChange={(event) => setNewTaskAssigneeId(event.target.value)}
              className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3"
            >
              <option value="">Unassigned</option>
              {(currentProject?.members ?? []).map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </label>
          <Button className="w-full" onClick={() => void handleCreateTaskFromModal()}>Create Task</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={isDeleteProjectConfirmOpen}
        title="Delete project"
        message="Delete this project and all related tasks? This cannot be undone."
        onCancel={() => setIsDeleteProjectConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteProjectConfirmOpen(false);
          void handleDeleteProject();
        }}
      />
    </PageWrapper>
  );
}
