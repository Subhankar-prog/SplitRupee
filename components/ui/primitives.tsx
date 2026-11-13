"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/scrollLock";

export { useBodyScrollLock } from "@/lib/scrollLock";

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(children, document.body);
}

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && !el.closest("[inert]") && el.offsetParent !== null
  );
}

/**
 * Shared accessible dialog keyboard behavior:
 * - Closes on Escape (unless disabled)
 * - Traps Tab / Shift+Tab within the dialog container
 * - Moves initial focus inside the dialog on open and restores trigger focus on close
 */
export function useDialogAccessibility(
  isOpen: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>,
  disabled = false
) {
  // Automatically manage global background scroll lock with reference counting
  useBodyScrollLock(isOpen);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const rafId = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(document.activeElement)) return;
      const autoFocusEl = container.querySelector<HTMLElement>("[autofocus], [data-autofocus]");
      const focusable = getFocusableElements(container);
      const target = autoFocusEl || focusable[0] || container;
      target?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (event.key === "Escape") {
        if (disabled) return;
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusableElements(container);
        if (focusable.length === 0) {
          event.preventDefault();
          container.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (!active || active === first || !container.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (!active || active === last || !container.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen, containerRef, disabled]);
}

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
    "bg-[var(--brand-primary)] text-[var(--brand-ink)] hover:bg-[var(--brand-primary-hover)] border border-transparent",
  secondary:
    "bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-strong)]",
  outline:
    "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] border border-[var(--border-strong)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] border border-transparent",
  danger:
    "bg-[var(--status-negative)] text-[var(--brand-ink)] hover:opacity-90 border border-transparent",
  accent:
    "bg-[var(--accent-gold)] text-[#171613] hover:bg-[var(--accent-gold-hover)] border border-[var(--accent-gold-border)] font-semibold",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[44px] sm:min-h-[32px] h-11 sm:h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "min-h-[44px] sm:min-h-[40px] h-11 sm:h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
  lg: "min-h-[44px] h-11 px-5 text-sm rounded-xl gap-2",
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
      className={`inline-flex items-center justify-center font-medium sr-interactive-transition sr-button-press focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />}
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
  const dims =
    size === "sm"
      ? "h-11 w-11 sm:h-8 sm:w-8 rounded-lg"
      : "h-11 w-11 sm:h-9 sm:w-9 rounded-xl";
  const tone =
    variant === "ghost"
      ? "border-transparent hover:bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      : variant === "secondary"
      ? "border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
      : "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center border sr-interactive-transition sr-button-press focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${dims} ${tone} ${className}`}
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
    "bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border-[var(--border-subtle)]",
  positive:
    "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]",
  brand:
    "bg-[var(--status-positive-bg)] text-[var(--brand-primary)] border-[var(--status-positive-border)]",
  negative:
    "bg-[var(--status-negative-bg)] text-[var(--status-negative)] border-[var(--status-negative-border)]",
  warning:
    "bg-[var(--accent-gold-bg)] text-[var(--accent-gold-ink)] border-[var(--accent-gold-border)]",
  sand:
    "bg-[var(--accent-gold-bg)] text-[var(--accent-gold-ink)] border-[var(--accent-gold-border)]",
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
      className={`h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${className}`}
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
      className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${className}`}
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
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useDialogAccessibility(isOpen, onClose, panelRef);

  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitle ? descId : undefined}
          tabIndex={-1}
          className={`relative w-full ${maxWidthClass} max-h-[min(90vh,calc(100dvh-1.5rem))] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-popover)] overflow-hidden outline-none sr-modal-panel`}
        >
          <div className="shrink-0 flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-[var(--border-subtle)]">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]"
              >
                {title}
              </h2>
              {subtitle && (
                <p id={descId} className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {subtitle}
                </p>
              )}
            </div>
            <IconButton label="Close dialog" size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function SkeletonBlock({ className = "h-10 w-full" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--bg-surface-secondary)] ${className}`}
    />
  );
}

