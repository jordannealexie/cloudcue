"use client";

import { ReactNode, useState } from "react";

interface DropdownMenuProps {
  trigger: ReactNode;
  items: Array<{ label: string; onClick: () => void }>;
}

export default function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-2)]"
      >
        {trigger}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-modal)] p-1">
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-card-2)]"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
