"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "../ui/Avatar";
import { useAppSelector } from "../../hooks/useAppStore";
import { useWorkspace } from "../../hooks/useWorkspace";
import PageTree from "../workspace/PageTree";
import Button from "../ui/Button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "My Tasks" },
  { href: "/notifications", label: "Notifications" },
  { href: "/team", label: "Team" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const unreadCount = useAppSelector((state) => state.notifications.items.filter((item) => !item.readAt).length);
  const { pageTree, createPage, setCurrentPageId } = useWorkspace();

  return (
    <aside className="hidden h-[calc(100vh-1rem)] w-[220px] shrink-0 rounded-[34px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 md:flex md:flex-col md:justify-between">
      <div>
        <div className="mb-6 flex items-center gap-2 px-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--text-primary)" />
            <path d="M8 8L16 16M16 8L8 16" stroke="var(--bg-card)" strokeWidth="2" />
          </svg>
          <span className="text-[24px] font-bold tracking-tight">CloudCue</span>
        </div>

        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Main</p>

        <nav className="space-y-2" aria-label="Sidebar">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`nav-hover flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-[14px] font-medium transition ${
                  active
                    ? "bg-[var(--bg-page)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-2)]"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[10px]">
                  {item.label.slice(0, 1)}
                </span>
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--accent-text)]">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Workspace</p>
            <Button variant="ghost" onClick={() => void createPage({ title: "Untitled" })}>+
            </Button>
          </div>
          <PageTree tree={pageTree} activeId={pathname.includes("/workspace/") ? pathname.split("/workspace/")[1] : null} onAddSubpage={(parentId) => {
            setCurrentPageId(parentId);
            void createPage({ title: "Untitled", parentId });
          }} />
        </div>

        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
          <Link
            href="/settings"
            className={`nav-hover flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-[14px] font-medium transition ${
              pathname.startsWith("/settings")
                ? "bg-[var(--bg-page)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-2)]"
            }`}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[10px]">
              S
            </span>
            Settings
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card-2)] p-3">
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2">
          <Avatar name={user?.name ?? "CloudCue User"} src={user?.avatarUrl} size="sm" />
          <div>
            <p className="text-[12px] font-semibold">{user?.name ?? "CloudCue User"}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{user?.email ?? "you@cloudcue.app"}</p>
          </div>
        </div>
        <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">Pro</span>
      </div>
    </aside>
  );
}
