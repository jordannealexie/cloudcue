"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

export default function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-8 w-14 items-center rounded-full border border-[var(--border)] bg-[var(--bg-card-2)] p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <span
        className={`h-6 w-6 rounded-full bg-[var(--accent)] transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`}
      />
    </button>
  );
}
