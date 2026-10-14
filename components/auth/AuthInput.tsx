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
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefixText && (
          <span className="pointer-events-none absolute left-3.5 text-xs font-bold text-slate-400">
            {prefixText}
          </span>
        )}
        <input
          id={id}
          className={`w-full h-12 rounded-xl border bg-white/[0.04] text-xs text-white placeholder-slate-500 outline-none transition ${
            prefixText ? "pl-11" : "pl-3.5"
          } ${Icon ? "pr-10" : "pr-3.5"} ${
            error
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              : "border-white/10 hover:border-white/20 focus:border-emerald-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-emerald-500"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {Icon && (
          <Icon className="pointer-events-none absolute right-3.5 h-4 w-4 text-slate-500" />
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-medium text-rose-400">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="text-[11px] text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
