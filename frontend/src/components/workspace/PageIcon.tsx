"use client";

import { icons } from "lucide-react";

interface PageIconProps {
  className?: string;
  icon?: string | null;
}

type LucideIconName = keyof typeof icons;

const legacyIconMap: Record<string, LucideIconName> = {
  doc: "FileText",
  note: "NotebookText",
  bookmark: "Bookmark",
  spark: "Sparkles",
  check: "BadgeCheck"
};

export default function PageIcon({ className = "h-5 w-5", icon = "doc" }: PageIconProps) {
  const mapped = icon ? legacyIconMap[icon] : undefined;
  const iconName = (mapped ?? icon ?? "FileText") as LucideIconName;
  const LucideIcon = icons[iconName] ?? icons.FileText;

  return (
    <span className={`inline-flex items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-2)] ${className}`} aria-hidden="true">
      <LucideIcon size={14} strokeWidth={1.8} />
    </span>
  );
}