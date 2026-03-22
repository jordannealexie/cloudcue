"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/workspace", label: "Workspace", icon: "workspace" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/settings", label: "Profile", icon: "settings" }
];

const MobileIcon = ({ kind }: { kind: string }) => {
  if (kind === "dashboard") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "projects") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h4l2 2h6A2.5 2.5 0 0 1 20.5 8.5v9A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "workspace") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4.5h7l3 3V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4.5V8h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "tasks") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 7h12M8 12h12M8 17h12M4 7.5 5.5 9 7 6.5M4 12.5 5.5 14 7 11.5M4 17.5 5.5 19 7 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.8-1l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.6.4 1.2.7 1.8 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] p-2 lg:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg text-[11px] font-medium ${
              active ? "bg-[var(--accent)] text-[var(--accent-text)]" : "text-[var(--text-secondary)]"
            }`}
          >
            <span><MobileIcon kind={item.icon} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
