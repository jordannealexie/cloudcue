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

export default function Topbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { logout } = useAuth();
  const { setMode, resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <header className="mb-4 flex items-center justify-between gap-2 rounded-[26px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2">
      <div className="hidden min-w-[260px] flex-1 items-center md:flex">
        <input
          type="text"
          readOnly
          value="Search tasks, pages, people...  Cmd+K"
          className="h-10 w-full rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-2)] px-4 text-[12px] text-[var(--text-secondary)]"
        />
      </div>

      <Toggle
        ariaLabel="Toggle theme"
        checked={resolvedTheme === "dark"}
        onChange={(checked) => setMode(checked ? "dark" : "light")}
      />

      <Link href="/notifications" className="widget-chip">
        Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
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
    </header>
  );
}
