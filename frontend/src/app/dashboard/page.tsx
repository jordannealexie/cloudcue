"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { useProjects } from "../../hooks/useProjects";
import { useTasks } from "../../hooks/useTasks";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { ApiResponse, DashboardStats } from "../../types";

const defaultStats: DashboardStats = {
  totalTasks: 0,
  inProgress: 0,
  completedToday: 0,
  overdue: 0,
  weeklyActivity: []
};

export default function DashboardPage() {
  const { items: projects, loadProjects } = useProjects();
  const { byProjectId } = useTasks();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const monthYearLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    []
  );

  useEffect(() => {
    if (projects.length === 0) {
      void loadProjects();
    }
  }, [loadProjects, projects.length]);

  useEffect(() => {
    const run = async (): Promise<void> => {
      try {
        const response = await apiClient.get<ApiResponse<DashboardStats>>("/dashboard/stats");
        setStats(response.data.data);
        setServiceMessage(null);
      } catch (_error) {
        setStats(defaultStats);
        setServiceMessage(getApiErrorMessage(_error, "Unable to load dashboard stats right now."));
      }
    };

    void run();
  }, []);

  const upcoming = useMemo(
    () => Object.values(byProjectId).flat().sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")).slice(0, 5),
    [byProjectId]
  );

  const members = projects[0]?.members ?? [];
  const insightBars = ["h-2", "h-3", "h-4", "h-5", "h-6", "h-3", "h-4", "h-6", "h-5", "h-3", "h-4", "h-2", "h-4", "h-6", "h-5", "h-3", "h-4", "h-5", "h-3", "h-2", "h-4", "h-5", "h-3", "h-4"];
  const productivityBars = ["h-[80px]", "h-[120px]", "h-[90px]", "h-[150px]", "h-[180px]", "h-[140px]", "h-[160px]"];

  return (
    <PageWrapper>
      <Topbar />

      <section className="grid gap-4 xl:grid-cols-[1.6fr_0.75fr]">
        <div className="space-y-4">
          {serviceMessage ? (
            <div className="surface-card border border-[var(--blush)]/40 bg-[var(--blush)]/10 p-3 text-[13px] text-[var(--text-primary)]">
              {serviceMessage}
            </div>
          ) : null}

          <div>
            <h1 className="text-[42px] font-bold leading-[1] tracking-[-0.02em]">Good morning</h1>
            <p className="mt-1 text-[16px] text-[var(--text-secondary)]">Here is what is on your plate today.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <article className="surface-card rotate-[-3deg] p-4">
              <p className="text-[14px] font-semibold">Tasks</p>
              <p className="mt-3 text-[44px] font-bold leading-none">{stats.totalTasks}</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--bg-card-2)]">
                <div className="progress-50 h-2 rounded-full bg-[var(--accent)]" />
              </div>
              <div className="mt-2 flex gap-2 text-[11px] text-[var(--text-secondary)]">
                <span>In Work</span>
                <span>Completed</span>
              </div>
            </article>

            <article className="accent-block p-4">
              <p className="text-[24px] font-bold leading-none">Core Team</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Product Members</p>
              <p className="mt-5 text-[13px]">{members.length || 32} Members</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.slice(0, 3).map((member) => (
                    <Avatar key={member.userId} name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  ))}
                </div>
                <span className="rounded-full bg-[var(--bg-page)] px-2 py-1 text-[11px]">+29</span>
              </div>
            </article>

            <article className="surface-card flex flex-col items-center justify-center border-dashed p-4 text-center">
              <p className="text-[28px] leading-none">Add New Board</p>
              <Link
                href="/projects?new=1"
                aria-label="Add board"
                className="mt-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-text)]"
              >
                +
              </Link>
            </article>

            <article className="surface-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[24px] font-bold leading-none">Team Insights</p>
                <span className="text-[12px] text-[var(--text-secondary)]">View all</span>
              </div>
              <div className="mb-4 grid grid-cols-12 items-end gap-1">
                {insightBars.map((heightClass, index) => (
                  <span
                    key={index}
                    className={`rounded-full ${heightClass} ${index % 3 === 0 ? "bg-[var(--text-primary)]" : "bg-[var(--border)]"}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.slice(0, 2).map((member) => (
                    <Avatar key={member.userId} name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  ))}
                </div>
                <button type="button" aria-label="Play insights" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-page)]">▶</button>
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
            <article className="ink-block p-4">
              <div className="grid grid-cols-[1fr_0.8fr] gap-4">
                <div className="flex h-[240px] items-end gap-3 rounded-3xl bg-[var(--bg-page)]/10 p-4">
                  {productivityBars.map((heightClass, index) => (
                    <span key={index} className={`w-full rounded-full bg-[var(--bg-card)] ${heightClass}`} />
                  ))}
                </div>
                <div className="space-y-3 rounded-3xl bg-[var(--bg-card)] p-3">
                  <div className="rounded-2xl border border-[var(--border-subtle)] p-3">
                    <p className="text-[13px] text-[var(--text-secondary)]">Productivity this week</p>
                    <p className="text-[28px] font-bold">-7%</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-subtle)] p-3">
                    <p className="text-[13px] text-[var(--text-secondary)]">Productivity this month</p>
                    <p className="text-[28px] font-bold">+13%</p>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)]">This year vs last year</p>
                </div>
              </div>
            </article>

            <article className="accent-block p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[30px] font-bold leading-none">History</p>
                <Badge>Working Days</Badge>
              </div>
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {["Yours", "Lukas", "Janny", "Andrey", "Tiffany"].map((name) => (
                  <span key={name} className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[12px]">{name}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: 30 }).map((_, index) => {
                  const active = [1, 4, 5, 7, 11, 13, 17, 20, 21, 25, 29].includes(index);
                  return (
                    <span
                      key={index}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[14px] ${
                        active ? "bg-[var(--bg-page)] text-[var(--text-primary)]" : "border border-[var(--border-subtle)]"
                      }`}
                    >
                      {index + 1}
                    </span>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-[20px] font-semibold">{monthYearLabel}</p>
            </article>
          </div>

          <article className="surface-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[32px] font-bold leading-none">Schedule</h2>
              <Badge>{monthYearLabel}</Badge>
            </div>
            <p className="mb-3 text-[14px] text-[var(--text-secondary)]">15 Upcoming Tasks</p>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1fr]">
              <div className="accent-block p-3">
                <p className="text-[28px] font-bold leading-none">Process</p>
                <div className="mt-3 space-y-2">
                  {["In Test", "Reviewed", "Complete"].map((item) => (
                    <div key={item} className="rounded-full bg-[var(--bg-page)] px-3 py-2 text-[13px]">{item}</div>
                  ))}
                </div>
              </div>
              <div>
                {upcoming.length === 0 ? (
                  <p className="text-[14px] text-[var(--text-secondary)]">No tasks available.</p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((task) => (
                      <div key={task.id} className="surface-elevated flex items-center justify-between p-3">
                        <div>
                          <p className="text-[14px] font-semibold">{task.title}</p>
                          <p className="text-[12px] text-[var(--text-secondary)]">{task.estimatedHours ?? 4} hours</p>
                        </div>
                        <Badge>{task.priority}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="ink-block p-4">
            <p className="text-[30px] font-bold leading-none">Time Tracker</p>
            <p className="mt-4 text-[52px] font-bold leading-none">07:40:15</p>
            <div className="mt-4 flex gap-2">
              <button type="button" aria-label="Pause" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)]">II</button>
              <button type="button" aria-label="Stop" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)]">■</button>
            </div>
          </article>
        </div>
      </section>
    </PageWrapper>
  );
}
