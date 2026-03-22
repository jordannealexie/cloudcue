"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "../ui/Avatar";
import { useAppSelector } from "../../hooks/useAppStore";
import { useWorkspace } from "../../hooks/useWorkspace";
import PageTree from "../workspace/PageTree";
import Button from "../ui/Button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/tasks", label: "My Tasks", icon: "tasks" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/team", label: "Team", icon: "team" },
];

const NavIcon = ({ kind }: { kind: string }) => {
  if (kind === "dashboard") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "projects") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h4l2 2h6A2.5 2.5 0 0 1 20.5 8.5v9A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "tasks") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 7h12M8 12h12M8 17h12M4 7.5 5.5 9 7 6.5M4 12.5 5.5 14 7 11.5M4 17.5 5.5 19 7 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "notifications") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4a5 5 0 0 0-5 5v2.5c0 .7-.2 1.3-.6 1.9L5.2 15h13.6l-1.2-1.6a3.1 3.1 0 0 1-.6-1.9V9a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2-8 4.5V20h16v-1.5c0-2.5-3.6-4.5-8-4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const unreadCount = useAppSelector((state) => state.notifications.items.filter((item) => !item.readAt).length);
  const { pageTree, createPage, removePage, setCurrentPageId } = useWorkspace();

  return (
    <aside className="hidden w-[248px] shrink-0 self-stretch rounded-r-[32px] border border-l-0 border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-5 md:flex md:flex-col md:justify-between">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--text-primary)" />
            <path d="M8 8L16 16M16 8L8 16" stroke="var(--bg-card)" strokeWidth="2" />
          </svg>
          <span className="text-[24px] font-bold tracking-tight">CloudCue</span>
        </div>

        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Main</p>

        <nav className="space-y-1.5" aria-label="Sidebar">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`nav-hover flex min-h-[46px] items-center gap-3 rounded-2xl px-3 text-[14px] font-medium transition ${
                  active
                    ? "bg-[var(--bg-page)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-2)]"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[10px]">
                  <NavIcon kind={item.icon} />
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

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Workspace</p>
            <Button variant="ghost" onClick={() => void createPage({ title: "Untitled" })}>+
            </Button>
          </div>
          <PageTree
            tree={pageTree}
            activeId={pathname.includes("/workspace/") ? pathname.split("/workspace/")[1] : null}
            onAddPage={() => void createPage({ title: "Untitled" })}
            onAddSubpage={(parentId) => {
              setCurrentPageId(parentId);
              void createPage({ title: "Untitled", parentId });
            }}
            onDeletePage={(pageId) => {
              void removePage(pageId);
            }}
          />
        </div>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
          <Link
            href="/settings"
            className={`nav-hover flex min-h-[46px] items-center gap-3 rounded-2xl px-3 text-[14px] font-medium transition ${
              pathname.startsWith("/settings")
                ? "bg-[var(--bg-page)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-2)]"
            }`}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[10px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.8-1l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.6.4 1.2.7 1.8 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Settings
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card-2)] p-3.5">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5">
          <Avatar name={user?.name ?? "CloudCue User"} src={user?.avatarUrl} size="sm" />
          <div>
            <p className="text-[12px] font-semibold">{user?.name ?? "CloudCue User"}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{user?.email ?? "you@cloudcue.app"}</p>
          </div>
        </div>
        <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">Pro</span>
      </div>
    </aside>
  );
}
