"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { useProjects } from "../../hooks/useProjects";
import { useTasks } from "../../hooks/useTasks";
import { useAppSelector } from "../../hooks/useAppStore";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { ApiResponse, DashboardStats } from "../../types";

const defaultStats: DashboardStats = {
  totalTasks: 0,
  inProgress: 0,
  completedToday: 0,
  overdue: 0,
  weeklyActivity: []
};

const formatDuration = (totalSeconds: number): string => {
  const safe = Math.max(totalSeconds, 0);
  const hours = Math.floor(safe / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export default function DashboardPage() {
  const { items: projects, loadProjects } = useProjects();
  const { byProjectId } = useTasks();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<string>("mine");
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

  useEffect(() => {
    try {
      const storedSeconds = Number(window.localStorage.getItem("cloudcue:timer:seconds") ?? "0");
      const storedRunning = window.localStorage.getItem("cloudcue:timer:running") === "1";

      if (Number.isFinite(storedSeconds) && storedSeconds >= 0) {
        setElapsedSeconds(storedSeconds);
      }

      setIsTimerRunning(storedRunning);
    } catch {
      setElapsedSeconds(0);
      setIsTimerRunning(false);
    }
  }, []);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [isTimerRunning]);

  useEffect(() => {
    try {
      window.localStorage.setItem("cloudcue:timer:seconds", String(elapsedSeconds));
      window.localStorage.setItem("cloudcue:timer:running", isTimerRunning ? "1" : "0");
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, [elapsedSeconds, isTimerRunning]);

  const upcoming = useMemo(
    () => Object.values(byProjectId).flat().sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")).slice(0, 5),
    [byProjectId]
  );

  const allTasks = useMemo(() => Object.values(byProjectId).flat(), [byProjectId]);

  const members = projects[0]?.members ?? [];
  const inWorkCount = stats.inProgress;
  const completedCount = Math.max(stats.totalTasks - stats.inProgress, 0);
  const completionPercent = stats.totalTasks > 0 ? Math.round((completedCount / stats.totalTasks) * 100) : 0;
  const extraMembers = Math.max(members.length - 3, 0);
  const insightBars = useMemo(() => {
    if (stats.weeklyActivity.length === 0) {
      return Array.from({ length: 7 }, (_, index) => ({
        height: 8,
        active: index % 3 === 0
      }));
    }

    const max = Math.max(...stats.weeklyActivity.map((item) => item.count), 1);
    return stats.weeklyActivity.map((item, index) => ({
      height: Math.max(8, Math.round((item.count / max) * 28)),
      active: index % 2 === 0
    }));
  }, [stats.weeklyActivity]);

  const productivityBars = useMemo(() => {
    if (stats.weeklyActivity.length === 0) {
      return Array.from({ length: 7 }, () => 40);
    }

    const max = Math.max(...stats.weeklyActivity.map((item) => item.count), 1);
    return stats.weeklyActivity.map((item) => Math.max(40, Math.round((item.count / max) * 180)));
  }, [stats.weeklyActivity]);

  const now = useMemo(() => new Date(), []);

  const periodChange = (currentPeriodStart: Date, previousPeriodStart: Date, previousPeriodEnd: Date) => {
    const current = allTasks.filter((task) => task.status === "done" && new Date(task.updatedAt) >= currentPeriodStart).length;
    const previous = allTasks.filter((task) => {
      const updated = new Date(task.updatedAt);
      return task.status === "done" && updated >= previousPeriodStart && updated < previousPeriodEnd;
    }).length;

    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    return Math.round(((current - previous) / previous) * 100);
  };

  const weeklyChange = useMemo(() => {
    const startCurrentWeek = new Date(now);
    startCurrentWeek.setDate(now.getDate() - now.getDay());
    startCurrentWeek.setHours(0, 0, 0, 0);

    const startPreviousWeek = new Date(startCurrentWeek);
    startPreviousWeek.setDate(startCurrentWeek.getDate() - 7);

    return periodChange(startCurrentWeek, startPreviousWeek, startCurrentWeek);
  }, [allTasks, now]);

  const monthlyChange = useMemo(() => {
    const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return periodChange(startCurrentMonth, startPreviousMonth, startCurrentMonth);
  }, [allTasks, now]);

  const historyUsers = useMemo(() => {
    const entries: Array<{ key: string; label: string; userId?: string }> = [{ key: "mine", label: "Yours", userId: currentUser?.id }];

    for (const member of members) {
      if (member.userId !== currentUser?.id) {
        entries.push({ key: member.userId, label: member.user.name, userId: member.userId });
      }
    }

    return entries;
  }, [currentUser?.id, members]);

  useEffect(() => {
    if (historyUsers.length > 0 && !historyUsers.some((user) => user.key === selectedHistoryUser)) {
      setSelectedHistoryUser(historyUsers[0].key);
    }
  }, [historyUsers, selectedHistoryUser]);

  const activeHistoryUserId = historyUsers.find((user) => user.key === selectedHistoryUser)?.userId;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const activeDays = useMemo(() => {
    const result = new Set<number>();

    for (const task of allTasks) {
      if (activeHistoryUserId && task.assigneeId !== activeHistoryUserId) {
        continue;
      }

      const date = new Date(task.updatedAt);
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        result.add(date.getDate());
      }
    }

    return result;
  }, [activeHistoryUserId, allTasks, now]);

  const statusSummary = useMemo(() => {
    const groups: Array<{ label: string; count: number }> = [
      { label: "To Do", count: allTasks.filter((task) => task.status === "todo").length },
      { label: "In Progress", count: allTasks.filter((task) => task.status === "in_progress").length },
      { label: "Done", count: allTasks.filter((task) => task.status === "done").length }
    ];

    return groups;
  }, [allTasks]);

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
                <div className="h-2 rounded-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
              </div>
              <div className="mt-2 flex gap-2 text-[11px] text-[var(--text-secondary)]">
                <span>In Work {inWorkCount}</span>
                <span>Completed {completedCount}</span>
              </div>
            </article>

            <article className="accent-block p-4">
              <p className="text-[24px] font-bold leading-none">Core Team</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Product Members</p>
              <p className="mt-5 text-[13px]">{members.length} Members</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.slice(0, 3).map((member) => (
                    <Avatar key={member.userId} name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  ))}
                </div>
                <span className="rounded-full bg-[var(--bg-page)] px-2 py-1 text-[11px]">+{extraMembers}</span>
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
                <Link href="/team" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">View all</Link>
              </div>
              <div className="mb-4 grid grid-cols-7 items-end gap-1">
                {insightBars.map((bar, index) => (
                  <span
                    key={index}
                    className={`rounded-full ${bar.active ? "bg-[var(--text-primary)]" : "bg-[var(--border)]"}`}
                    style={{ height: `${bar.height}px` }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.slice(0, 2).map((member) => (
                    <Avatar key={member.userId} name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  ))}
                </div>
                <Link href="/team" aria-label="Open team insights" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-page)]">▶</Link>
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
            <article className="ink-block p-4">
              <div className="grid grid-cols-[1fr_0.8fr] gap-4">
                <div className="flex h-[240px] items-end gap-3 rounded-3xl bg-[var(--bg-page)]/10 p-4">
                  {productivityBars.map((height, index) => (
                    <span key={index} className="w-full rounded-full bg-[var(--bg-card)]" style={{ height: `${height}px` }} />
                  ))}
                </div>
                <div className="space-y-3 rounded-3xl bg-[var(--bg-card)] p-3">
                  <div className="rounded-2xl border border-[var(--border-subtle)] p-3">
                    <p className="text-[13px] text-[var(--text-secondary)]">Productivity this week</p>
                    <p className="text-[28px] font-bold">{weeklyChange >= 0 ? `+${weeklyChange}%` : `${weeklyChange}%`}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-subtle)] p-3">
                    <p className="text-[13px] text-[var(--text-secondary)]">Productivity this month</p>
                    <p className="text-[28px] font-bold">{monthlyChange >= 0 ? `+${monthlyChange}%` : `${monthlyChange}%`}</p>
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
                {historyUsers.map((user) => (
                  <button
                    key={user.key}
                    type="button"
                    onClick={() => setSelectedHistoryUser(user.key)}
                    className={`rounded-full border px-3 py-1 text-[12px] ${
                      selectedHistoryUser === user.key
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                        : "border-[var(--border-subtle)]"
                    }`}
                  >
                    {user.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const active = activeDays.has(day);
                  return (
                    <span
                      key={day}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[14px] ${
                        active ? "bg-[var(--bg-page)] text-[var(--text-primary)]" : "border border-[var(--border-subtle)]"
                      }`}
                    >
                      {day}
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
            <p className="mb-3 text-[14px] text-[var(--text-secondary)]">{upcoming.length} Upcoming Tasks</p>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1fr]">
              <div className="accent-block p-3">
                <p className="text-[28px] font-bold leading-none">Process</p>
                <div className="mt-3 space-y-2">
                  {statusSummary.map((item) => (
                    <div key={item.label} className="rounded-full bg-[var(--bg-page)] px-3 py-2 text-[13px]">
                      {item.label} ({item.count})
                    </div>
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
            <p className="mt-4 text-[52px] font-bold leading-none">{formatDuration(elapsedSeconds)}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                aria-label={isTimerRunning ? "Pause" : "Start"}
                onClick={() => setIsTimerRunning((running) => !running)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)]"
              >
                {isTimerRunning ? "II" : "▶"}
              </button>
              <button
                type="button"
                aria-label="Reset"
                onClick={() => {
                  setIsTimerRunning(false);
                  setElapsedSeconds(0);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)]"
              >
                ■
              </button>
            </div>
          </article>
        </div>
      </section>
    </PageWrapper>
  );
}
