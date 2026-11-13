"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  prefixText?: string;
}

export default function AuthInput({
  id,
  label,
  error,
  helperText,
  icon: Icon,
  prefixText,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefixText && (
          <span className="pointer-events-none absolute left-3.5 text-xs font-semibold text-[var(--text-secondary)]">
            {prefixText}
          </span>
        )}
        <input
          id={id}
          className={`w-full h-11 rounded-xl border bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors ${
            prefixText ? "pl-11" : "pl-3.5"
          } ${Icon ? "pr-10" : "pr-3.5"} ${
            error
              ? "border-[var(--status-negative)] focus:ring-2 focus:ring-[var(--status-negative-bg)]"
              : "border-[var(--border-strong)] hover:border-[var(--brand-primary)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)]"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {Icon && (
          <Icon className="pointer-events-none absolute right-3.5 h-4 w-4 text-[var(--text-secondary)]" />
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-medium text-[var(--status-negative)]">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="text-[11px] text-[var(--text-secondary)]">
          {helperText}
        </p>
      )}
    </div>
  );
}
