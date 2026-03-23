"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface ContextMenuProps {
  children: ReactNode;
  items: Array<{ label: string; onClick: () => void }>;
}

export default function ContextMenu({ children, items }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
    <div
      ref={containerRef}
      onContextMenu={(event) => {
        event.preventDefault();
        setPosition({ x: event.clientX, y: event.clientY });
        setOpen(true);
      }}
      onClick={() => setOpen(false)}
    >
      {children}
      {open ? (
        <div
          className="fixed z-[80] min-w-[180px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-modal)] p-1"
          style={{ left: position.x, top: position.y }}
        >
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
