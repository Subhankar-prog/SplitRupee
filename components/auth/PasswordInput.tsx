"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  label: string;
  error?: string;
  rightLabelAction?: React.ReactNode;
}

export default function PasswordInput({
  id,
  label,
  error,
  rightLabelAction,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
        {rightLabelAction}
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className={`w-full h-11 rounded-xl border bg-[var(--bg-surface-secondary)] pl-3.5 pr-11 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors ${
            error
              ? "border-[var(--status-negative)] focus:ring-2 focus:ring-[var(--status-negative-bg)]"
              : "border-[var(--border-strong)] hover:border-[var(--brand-primary)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)]"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3.5 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-medium text-[var(--status-negative)]">
          {error}
        </p>
      )}
    </div>
  );
}
