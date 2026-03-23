"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface DropdownMenuProps {
  trigger: ReactNode;
  items: Array<{ label: string; onClick: () => void; tone?: "default" | "danger" }>;
}

export default function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-2)]"
      >
        {trigger}
      </button>
      {open ? (
        <div className="pop-in absolute right-0 top-10 z-50 min-w-[190px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-modal)] p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium transition hover:bg-[var(--bg-card-2)] ${
                item.tone === "danger" ? "text-[var(--blush)]" : "text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
