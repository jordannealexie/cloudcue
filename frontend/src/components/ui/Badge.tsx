"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-[24px] items-center rounded-full border border-[var(--border-subtle)] px-2 text-[12px] font-medium text-[var(--text-secondary)] ${className}`}
    >
      {children}
    </span>
  );
}
