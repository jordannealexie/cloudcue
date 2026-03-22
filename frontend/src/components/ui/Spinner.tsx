"use client";

export default function Spinner() {
  return (
    <span
      aria-label="Loading"
      className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
    />
  );
}
