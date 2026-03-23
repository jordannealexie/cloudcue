"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "../ui/Avatar";
import Toggle from "../ui/Toggle";
import { useTheme } from "../../hooks/useTheme";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchNotificationsThunk } from "../../store/slices/notificationsSlice";
import { useAuth } from "../../hooks/useAuth";
import PageSearch from "../workspace/PageSearch";
import Modal from "../ui/Modal";

export default function Topbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { logout } = useAuth();
  const { setMode, resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.accessToken);
  const totalNotifications = useAppSelector((state) => state.notifications.items.length);
  const unreadCount = useAppSelector((state) => state.notifications.items.filter((item) => !item.readAt).length);

  useEffect(() => {
    if (!token || totalNotifications > 0) {
      return;
    }

    void dispatch(fetchNotificationsThunk("all"));
  }, [dispatch, token, totalNotifications]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setMode(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }

      if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolvedTheme, setMode]);

  return (
    <header className="mb-4 flex items-center justify-between gap-3 rounded-[26px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2.5">
      <div className="hidden min-w-[260px] flex-1 items-center md:flex">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="inline-flex h-10 w-full items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-2)] px-4 text-left text-[12px] text-[var(--text-secondary)] transition hover:border-[var(--border)]"
        >
          <span className="truncate">Search tasks, pages, people...</span>
          <span className="ml-auto rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px]">Cmd+K</span>
        </button>
      </div>

      <Toggle
        ariaLabel="Toggle theme"
        checked={resolvedTheme === "dark"}
        onChange={(checked) => setMode(checked ? "dark" : "light")}
      />

      <button
        type="button"
        onClick={() => setIsShortcutsOpen(true)}
        className="inline-flex h-10 min-w-[66px] items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-2)] px-3 text-[11px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)]"
      >
        ? Shortcuts
      </button>

      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-2)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4a5 5 0 0 0-5 5v2.6c0 .6-.2 1.2-.6 1.7L5 15h14l-1.4-1.7c-.4-.5-.6-1.1-.6-1.7V9a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--accent-text)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-2)] px-2 py-1"
        >
          <Avatar name={user?.name ?? "Lukas"} src={user?.avatarUrl} size="sm" />
          <span className="hidden text-[12px] text-[var(--text-secondary)] md:inline">{user?.name ?? "Profile"}</span>
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2">
            <div className="mb-2 border-b border-[var(--border-subtle)] px-2 pb-2">
              <p className="text-[12px] font-semibold">{user?.name ?? "CloudCue User"}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{user?.email ?? ""}</p>
            </div>

            <Link href="/settings" className="block rounded-lg px-2 py-2 text-[12px] hover:bg-[var(--bg-card-2)]">
              Account settings
            </Link>
            <Link href="/team" className="block rounded-lg px-2 py-2 text-[12px] hover:bg-[var(--bg-card-2)]">
              Invite teammates
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[12px] text-[var(--blush)] hover:bg-[var(--bg-card-2)]"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>

      <PageSearch open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Modal open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} title="Keyboard shortcuts">
        <div className="space-y-2 text-[12px]">
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
            <span>Open search</span>
            <span className="text-[var(--text-secondary)]">Cmd/Ctrl + K</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
            <span>Toggle dark or light mode</span>
            <span className="text-[var(--text-secondary)]">Cmd/Ctrl + Shift + L</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
            <span>Open shortcuts</span>
            <span className="text-[var(--text-secondary)]">?</span>
          </div>
        </div>
      </Modal>
    </header>
  );
}
