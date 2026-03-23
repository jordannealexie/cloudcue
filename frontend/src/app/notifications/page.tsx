"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/ui/Button";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
  markNotificationReadThunk
} from "../../store/slices/notificationsSlice";
import type { NotificationItem } from "../../types";

type FilterTab = "all" | "unread" | "mentions" | "tasks" | "comments" | "system";

const formatRelative = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.notifications.items);
  const isLoading = useAppSelector((state) => state.notifications.isLoading);
  const error = useAppSelector((state) => state.notifications.error);
  const [tab, setTab] = useState<FilterTab>("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchNotificationsThunk(tab));
  }, [dispatch, tab]);

  const filtered = useMemo(() => {
    if (tab === "unread") {
      return items.filter((item) => !item.readAt);
    }

    if (tab === "all") {
      return items;
    }

    if (tab === "mentions") {
      return items.filter((item) => item.type === "mention");
    }

    if (tab === "tasks") {
      return items.filter((item) => item.type === "task");
    }

    if (tab === "comments") {
      return items.filter((item) => item.type === "comment");
    }

    return items.filter((item) => item.type === "system");
  }, [items, tab]);

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <PageWrapper>
      <Topbar />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[28px] font-bold">Notifications</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Activity across mentions, tasks, comments, and workspace events.</p>
        </div>
        <Button
          variant="secondary"
          isLoading={isMarkingAll}
          onClick={async () => {
            setIsMarkingAll(true);
            const result = await dispatch(markAllNotificationsReadThunk());
            if (markAllNotificationsReadThunk.fulfilled.match(result)) {
              setMessage("All notifications marked as read.");
            } else {
              setMessage((result.payload as string) ?? "Unable to mark all as read.");
            }
            setIsMarkingAll(false);
          }}
        >
          Mark all as read
        </Button>
      </div>

      {error ? <div className="surface-card mb-3 p-3 text-[12px] text-[var(--blush)]">{error}</div> : null}
      {message ? <div className="surface-card mb-3 p-3 text-[12px] text-[var(--text-secondary)]">{message}</div> : null}

      <div className="mb-4 flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "mentions", label: "Mentions" },
          { key: "tasks", label: "Tasks" },
          { key: "comments", label: "Comments" },
          { key: "system", label: "System" }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as FilterTab)}
            className={`rounded-full border px-3 py-1 text-[12px] ${
              tab === item.key
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <article key={index} className="surface-card border-l-4 border-transparent p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="w-full space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-[var(--bg-card-2)]" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--bg-card-2)]" />
                </div>
                <div className="h-3 w-14 animate-pulse rounded bg-[var(--bg-card-2)]" />
              </div>
              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-[var(--bg-card-2)]" />
            </article>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <p className="text-[18px] font-semibold">You are all caught up</p>
          <p className="text-[13px] text-[var(--text-secondary)]">No new notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification: NotificationItem) => (
            <article
              key={notification.id}
              className={`surface-card border-l-4 p-4 ${notification.readAt ? "border-transparent" : "border-[var(--accent)]"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px] font-semibold">{notification.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">{notification.body}</p>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">{formatRelative(notification.createdAt)}</span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-[12px]">
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => void dispatch(markNotificationReadThunk(notification.id))}
                    className="text-[var(--accent)]"
                  >
                    Open
                  </Link>
                ) : null}

                {!notification.readAt ? (
                  <button
                    type="button"
                    onClick={() => void dispatch(markNotificationReadThunk(notification.id))}
                    className="text-[var(--text-secondary)]"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
