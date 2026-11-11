"use client";

import React from "react";

interface SplitRupeeLoaderProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
}

export default function SplitRupeeLoader({
  text = "SplitRupee",
  subtext = "Loading your account...",
  fullScreen = true,
}: SplitRupeeLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3.5 text-center select-none">
      <div className="relative flex items-center justify-center h-12 w-12">
        <div className="absolute inset-0 rounded-2xl border-2 border-[var(--border-subtle)] border-t-[var(--brand-primary)] animate-spin" />
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] font-display font-bold text-white dark:text-[#171F1D] text-base keep-white">
          ₹
        </div>
      </div>

      <div className="space-y-0.5">
        <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--text-primary)]">
          {text}
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">{subtext}</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas)]/95">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center">
      {content}
    </div>
  );
}
