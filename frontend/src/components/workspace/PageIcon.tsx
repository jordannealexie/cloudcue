"use client";

interface PageIconProps {
  className?: string;
}

export default function PageIcon({ className = "h-5 w-5" }: PageIconProps) {
  return (
    <span className={`inline-flex items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-2)] ${className}`} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M7 4.5h7l3 3V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4.5V8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}