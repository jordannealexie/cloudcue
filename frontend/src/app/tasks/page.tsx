"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Badge from "../../components/ui/Badge";
import { useProjects } from "../../hooks/useProjects";
import { useTasks } from "../../hooks/useTasks";
import type { Task } from "../../types";

type TaskFilter = "all" | "today" | "week" | "overdue" | "completed";

const isSameDay = (dateValue: string, target: Date): boolean => {
  const date = new Date(dateValue);
  return date.toDateString() === target.toDateString();
};

const isThisWeek = (dateValue: string): boolean => {
  const date = new Date(dateValue);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
};

export default function TasksPage() {
  const { items: projects, loadProjects, error: projectsError } = useProjects();
  const { byProjectId, loadTasks, error: tasksError } = useTasks();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const error = projectsError ?? tasksError;

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    for (const project of projects) {
      void loadTasks(project.id);
    }
  }, [loadTasks, projects]);

  const grouped = useMemo(() => {
    const now = new Date();

    return projects
      .map((project) => {
        const tasks = (byProjectId[project.id] ?? []).filter((task: Task) => {
          if (filter === "all") return true;
          if (filter === "completed") return task.status === "done";
          if (!task.dueDate) return false;
          if (filter === "today") return isSameDay(task.dueDate, now);
          if (filter === "week") return isThisWeek(task.dueDate);
          if (filter === "overdue") return task.status !== "done" && new Date(task.dueDate) < now;
          return true;
        });

        return {
          projectId: project.id,
          projectName: project.name,
          tasks
        };
      })
      .filter((group) => group.tasks.length > 0 || filter === "all");
  }, [byProjectId, filter, projects]);

  const totalTasks = grouped.reduce((total, group) => total + group.tasks.length, 0);

  return (
    <PageWrapper>
      <Topbar />

      <div className="mb-4">
        <h1 className="text-[28px] font-bold">My Tasks</h1>
        <p className="text-[14px] text-[var(--text-secondary)]">Everything assigned to you, across all projects.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "today", label: "Today" },
          { key: "week", label: "This week" },
          { key: "overdue", label: "Overdue" },
          { key: "completed", label: "Completed" }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key as TaskFilter)}
            className={`rounded-full border px-3 py-1 text-[12px] ${
              filter === item.key
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <div className="surface-card mb-4 p-4 text-[var(--blush)]">{error}</div> : null}

      {totalTasks === 0 ? (
        <div className="surface-card p-6 text-center">
          <p className="text-[18px] font-semibold">Nothing here</p>
          <p className="text-[13px] text-[var(--text-secondary)]">You have no tasks in this filter.</p>
          <Link href="/projects" className="mt-2 inline-block text-[13px] text-[var(--accent)]">
            Go to projects
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <section key={group.projectId} className="surface-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold">{group.projectName}</h2>
                <Badge>{group.tasks.length} tasks</Badge>
              </div>

              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <div key={task.id} className="surface-elevated flex items-center justify-between p-3">
                    <div>
                      <p className="text-[14px] font-semibold">{task.title}</p>
                      <p className="text-[12px] text-[var(--text-secondary)]">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{task.priority}</Badge>
                      <Badge>{task.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
