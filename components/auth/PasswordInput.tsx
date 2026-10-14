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
        <label htmlFor={id} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
        {rightLabelAction}
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className={`w-full h-12 rounded-xl border bg-white/[0.04] pl-3.5 pr-11 text-xs text-white placeholder-slate-500 outline-none transition ${
            error
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              : "border-white/10 hover:border-white/20 focus:border-emerald-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-emerald-500"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded transition"
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
        <p id={`${id}-error`} className="text-[11px] font-medium text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
