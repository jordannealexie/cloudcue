"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = "", id, type, ...props },
  ref
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const isPasswordField = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <label htmlFor={inputId} className="flex w-full flex-col gap-2">
      <span className="text-meta text-[var(--text-secondary)]">{label}</span>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={`w-full rounded-[10px] border bg-[var(--bg-card-2)] px-3 py-2 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:border-[var(--accent)] focus:outline-none ${error ? "border-[var(--blush)]" : "border-[var(--border)]"} ${isPasswordField ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
      {error ? <span className="text-[12px] text-[var(--blush)]">{error}</span> : null}
    </label>
  );
});

export default Input;
