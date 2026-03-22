"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = "", id, ...props },
  ref
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="flex w-full flex-col gap-2">
      <span className="text-meta text-[var(--text-secondary)]">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-[10px] border bg-[var(--bg-card-2)] px-3 py-2 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:border-[var(--accent)] focus:outline-none ${error ? "border-[#ef4444]" : "border-[var(--border)]"} ${className}`}
        {...props}
      />
      {error ? <span className="text-[12px] text-[#ef4444]">{error}</span> : null}
    </label>
  );
});

export default Input;
