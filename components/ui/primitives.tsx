"use client";

import React from "react";
import { Loader2, X } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-dark)] text-white hover:opacity-95 dark:bg-[var(--brand-primary)] dark:text-[#171F1D] border border-transparent",
  secondary:
    "bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]",
  outline:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] border border-transparent",
  danger:
    "bg-[var(--status-negative)] text-white hover:opacity-95 border border-transparent",
  accent:
    "bg-[var(--accent-sand)] text-[#171F1D] hover:opacity-95 border border-transparent",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-sm rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
  variant?: "ghost" | "outline" | "secondary";
}

export function IconButton({
  label,
  size = "md",
  variant = "outline",
  className = "",
  children,
  ...props
}: IconButtonProps) {
  const dims = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl";
  const tone =
    variant === "ghost"
      ? "border-transparent hover:bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      : variant === "secondary"
      ? "border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${dims} ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

type BadgeVariant = "neutral" | "positive" | "negative" | "warning" | "brand" | "sand";

const BADGE_STYLE: Record<BadgeVariant, string> = {
  neutral:
    "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
  positive:
    "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]",
  brand:
    "bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border-[var(--status-positive-border)]",
  negative:
    "bg-[var(--status-negative-bg)] text-[var(--status-negative)] border-[var(--status-negative-border)]",
  warning:
    "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]",
  sand:
    "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${BADGE_STYLE[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none transition-colors focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none transition-colors focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] ${className}`}
      {...props}
    />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-8 sm:p-10 text-center">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = "max-w-lg",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[var(--overlay-backdrop)] backdrop-blur-sm">
      <div
        className={`relative w-full ${maxWidthClass} rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-popover)] max-h-[92dvh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="min-w-0">
            <h2 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          <IconButton label="Close dialog" size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = "h-10 w-full" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--bg-surface-secondary)] ${className}`}
    />
  );
}

