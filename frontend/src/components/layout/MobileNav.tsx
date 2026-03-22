"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/workspace", label: "Workspace" },
  { href: "/tasks", label: "Tasks" },
  { href: "/settings", label: "Profile" }
];

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
            <span>{item.label.slice(0, 1)}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
