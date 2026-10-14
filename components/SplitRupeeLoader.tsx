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
    <div className="flex flex-col items-center justify-center gap-4 text-center select-none animate-in fade-in duration-300">
      {/* Branded Glowing Ring with Rupee Symbol */}
      <div className="relative flex items-center justify-center">
        {/* Outer rotating pulse aura */}
        <div className="absolute h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500/25 to-teal-400/25 blur-xl animate-pulse" />

        {/* Animated Spin Ring */}
        <div className="h-14 w-14 rounded-2xl border-2 border-emerald-500/20 border-t-emerald-400 border-r-teal-400 animate-spin" />

        {/* Inner Glass Badge with Rupee Icon */}
        <div className="absolute flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-extrabold text-slate-950 text-xl shadow-lg shadow-emerald-500/30">
          ₹
        </div>
      </div>

      {/* Brand Title & Pulsing Subtitle */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold tracking-widest text-white uppercase">
          {text}
        </h3>
        <p className="text-[11.5px] font-medium text-emerald-400/80 animate-pulse">
          {subtext}
        </p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
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
