"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] hover:bg-[var(--accent-hover)]",
  secondary: "bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-card-2)]",
  ghost: "bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-card-2)]",
  danger: "bg-[var(--blush)] text-[var(--text-primary)] border border-[var(--border)] hover:opacity-90"
};

export default function Button({ variant = "primary", isLoading = false, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={typeof children === "string" ? children : props["aria-label"]}
      className={`rounded-[10px] min-h-[40px] min-w-[44px] px-4 text-sm font-semibold transition duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
