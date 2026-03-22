"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        {children}
      </span>
      {open ? (
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--bg-modal)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
          {content}
        </span>
      ) : null}
    </span>
  );
}
