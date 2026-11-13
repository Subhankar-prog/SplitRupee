"use client";

import React, { useId } from "react";

export type SplitRupeeLoaderVariant = "fullScreen" | "page" | "modal" | "inline" | "skeleton";

export interface SplitRupeeLoaderProps {
  /** Main title displayed under the loader */
  text?: string;
  /** Contextual helper text explaining what is happening */
  subtext?: string;
  /** Optional secondary headline for fullScreen presentation */
  headline?: string;
  /** Legacy flag for backward-compatibility; maps to variant="fullScreen" when true */
  fullScreen?: boolean;
  /** Modern loader variant: fullScreen, page, modal, inline, or skeleton */
  variant?: SplitRupeeLoaderVariant;
  /** Additional CSS classes for outer container */
  className?: string;
}

/**
 * SplitRupee Signature Road-Trip Convertible Loader:
 * - Inspired by Dribbble 5938850 (Cynthia_Sun - convertible road trip journey)
 * - Minimalist vector convertible traveling on an active highway
 * - Background city skyline, suspension chassis bounce, rotating wheels, and puffing exhaust rings
 * - Pure SVG & CSS keyframes in Warm Modern Fintech palette (Terracotta, Sage, Warm Gold, Sand)
 * - Fully accessible and prefers-reduced-motion safe
 */
export function SplitRupeeRoadTripCar({
  size = "md",
  className = "",
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const uid = useId().replace(/:/g, "_");

  // Inline micro variant for buttons
  if (size === "xs") {
    return (
      <svg
        className={`w-5 h-4 shrink-0 select-none ${className}`}
        viewBox="0 0 32 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Compact mini car silhouette */}
        <path
          d="M 4 12 L 8 12 L 11 6 L 18 6 L 21 12 L 28 12 C 29 12 30 13 30 14 C 30 15 29 16 28 16 L 26 16 M 20 16 L 14 16 M 8 16 L 3 16 C 2 16 1 15 1 14 C 1 13 2 12 4 12 Z"
          stroke="var(--brand-primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Rotating mini wheels */}
        <circle cx="11" cy="15" r="2.5" stroke="var(--status-positive)" strokeWidth="1.8" fill="var(--bg-surface)" />
        <circle cx="23" cy="15" r="2.5" stroke="var(--status-positive)" strokeWidth="1.8" fill="var(--bg-surface)" />
      </svg>
    );
  }

  const dims = {
    sm: "w-44 h-24",
    md: "w-64 h-36",
    lg: "w-80 h-44",
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center select-none ${dims} ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 280 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Headlight beam soft gradient */}
          <linearGradient id={`headlight_${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0" />
          </linearGradient>

          {/* Car body fill subtle gradient */}
          <linearGradient id={`carBody_${uid}`} x1="90" y1="85" x2="230" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-primary-hover)" />
          </linearGradient>
        </defs>

        {/* 1. BACKGROUND SKYLINE (Architectural travel destination silhouette) */}
        <g className="stroke-[var(--border-subtle)] dark:stroke-[var(--border-strong)] opacity-50" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Left buildings */}
          <path d="M 6 128 L 6 82 L 18 82 L 18 64 L 32 64 L 32 96 L 44 96 L 44 76 L 58 76 L 58 128" />
          <path d="M 12 72 L 12 78" />
          <path d="M 24 54 L 24 60" />
          <path d="M 50 84 L 50 90" />

          {/* Center tall architectural tower & antenna */}
          <path d="M 128 128 L 128 50 L 142 50 L 142 32 L 146 32 L 146 22 L 148 22 L 148 32 L 152 32 L 152 50 L 166 50 L 166 128" />
          <line x1="147" y1="12" x2="147" y2="22" strokeWidth="1.5" />

          {/* Right cityscape */}
          <path d="M 206 128 L 206 88 L 218 88 L 218 58 L 232 58 L 232 78 L 248 78 L 248 94 L 264 94 L 264 70 L 276 70 L 276 128" />
          <path d="M 224 68 L 224 74" />
          <path d="M 256 84 L 256 90" />
        </g>

        {/* 2. HIGHWAY & ROAD SURFACE */}
        {/* Solid ground line */}
        <line
          x1="0"
          y1="138"
          x2="280"
          y2="138"
          stroke="var(--border-subtle)"
          strokeWidth="2"
        />

        {/* Active dashed lane line scrolling left */}
        <line
          x1="0"
          y1="138"
          x2="280"
          y2="138"
          stroke="var(--border-strong)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="14 16"
          className="animate-[sr-road-flow_0.85s_linear_infinite] motion-reduce:animate-none"
        />

        {/* 3. FLOATING EXHAUST PUFFS / RINGS (Drifting back from tailpipe) */}
        <g className="stroke-[var(--text-secondary)] fill-none" strokeWidth="2.2" strokeLinecap="round">
          {/* Ring 1 (Smallest, closest to tailpipe) */}
          <circle
            cx="80"
            cy="118"
            r="4.5"
            className="animate-[sr-exhaust-ring-1_1.2s_ease-out_infinite] origin-[80px_118px] motion-reduce:opacity-0"
          />
          {/* Ring 2 (Medium, mid-drift) */}
          <circle
            cx="80"
            cy="118"
            r="6.5"
            className="animate-[sr-exhaust-ring-2_1.2s_ease-out_0.4s_infinite] origin-[80px_118px] motion-reduce:opacity-0"
          />
          {/* Ring 3 (Largest, fading away) */}
          <circle
            cx="80"
            cy="118"
            r="8.5"
            className="animate-[sr-exhaust-ring-3_1.2s_ease-out_0.8s_infinite] origin-[80px_118px] motion-reduce:opacity-0"
          />
        </g>

        {/* 4. THE ROAD-TRIP CONVERTIBLE (Chassis + Suspension Bounce) */}
        <g className="animate-[sr-car-suspension_0.75s_ease-in-out_infinite] motion-reduce:animate-none">
          {/* Headlight illumination cone */}
          <polygon
            points="228,114 278,102 278,132 228,122"
            fill={`url(#headlight_${uid})`}
            className="opacity-80"
          />

          {/* Car Body Shell (Terracotta with clean outlines) */}
          <path
            d="M 88 116 
               C 86 116 84 118 84 122 
               C 84 125 87 126 92 126 
               L 96 126 
               A 16 16 0 0 1 128 126 
               L 168 126 
               A 16 16 0 0 1 200 126 
               L 224 126 
               C 228 126 230 123 230 119 
               C 230 115 227 113 222 113 
               L 194 113 
               L 172 88 
               C 170 86 167 86 165 88 
               L 155 102 
               L 136 102 
               C 134 102 133 103 133 105 
               L 133 113 
               L 92 113 
               C 89 113 88 114 88 116 Z"
            fill={`url(#carBody_${uid})`}
            stroke="var(--brand-dark)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Windshield Glass Frame & Specular Glint */}
          <line
            x1="168"
            y1="88"
            x2="154"
            y2="105"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Steering Wheel */}
          <ellipse
            cx="160"
            cy="99"
            rx="3"
            ry="6"
            transform="rotate(25 160 99)"
            stroke="var(--text-primary)"
            strokeWidth="2"
            fill="none"
          />

          {/* Car Door Cutline */}
          <path
            d="M 135 113 L 135 125 M 172 113 L 172 125"
            stroke="var(--brand-dark)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          {/* Door Handle */}
          <line
            x1="142"
            y1="117"
            x2="149"
            y2="117"
            stroke="var(--brand-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Front Headlight (Warm Gold) */}
          <circle cx="227" cy="117" r="3.5" fill="var(--accent-gold)" stroke="var(--brand-ink)" strokeWidth="1" />

          {/* Rear Taillight */}
          <rect x="85" y="117" width="2.5" height="5" rx="1" fill="var(--status-negative)" />

          {/* Rear Wheel (Nested in arch, rotating) */}
          <g className="origin-[112px_126px] animate-[sr-wheel-rotate_0.85s_linear_infinite] motion-reduce:animate-none">
            {/* Outer Tire */}
            <circle cx="112" cy="126" r="13" fill="var(--text-primary)" stroke="var(--bg-canvas)" strokeWidth="2" />
            {/* Inner Sage Rim */}
            <circle cx="112" cy="126" r="8" fill="var(--status-positive-bg)" stroke="var(--status-positive)" strokeWidth="1.8" />
            {/* Wheel Spokes */}
            <line x1="112" y1="118" x2="112" y2="134" stroke="var(--status-positive)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="104" y1="126" x2="120" y2="126" stroke="var(--status-positive)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Gold Central Hub */}
            <circle cx="112" cy="126" r="3" fill="var(--accent-gold)" />
          </g>

          {/* Front Wheel (Nested in arch, rotating) */}
          <g className="origin-[184px_126px] animate-[sr-wheel-rotate_0.85s_linear_infinite] motion-reduce:animate-none">
            {/* Outer Tire */}
            <circle cx="184" cy="126" r="13" fill="var(--text-primary)" stroke="var(--bg-canvas)" strokeWidth="2" />
            {/* Inner Sage Rim */}
            <circle cx="184" cy="126" r="8" fill="var(--status-positive-bg)" stroke="var(--status-positive)" strokeWidth="1.8" />
            {/* Wheel Spokes */}
            <line x1="184" y1="118" x2="184" y2="134" stroke="var(--status-positive)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="176" y1="126" x2="192" y2="126" stroke="var(--status-positive)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Gold Central Hub */}
            <circle cx="184" cy="126" r="3" fill="var(--accent-gold)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Retain alias for any existing callers
export const SplitRupeeBrandMark = SplitRupeeRoadTripCar;
export const SplitRupeeAbstractSculpture = SplitRupeeRoadTripCar;

export default function SplitRupeeLoader({
  text = "SplitRupee",
  headline = "On the road together.",
  subtext = "Getting your groups ready...",
  fullScreen,
  variant,
  className = "",
}: SplitRupeeLoaderProps) {
  // Resolve effective variant with legacy fullScreen support
  const effectiveVariant: SplitRupeeLoaderVariant =
    variant ?? (fullScreen === false ? "page" : "fullScreen");

  // 1. INLINE VARIANT (For buttons, cards, local status updates)
  if (effectiveVariant === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] ${className}`}
      >
        <SplitRupeeRoadTripCar size="xs" />
        {subtext && <span className="font-medium">{subtext}</span>}
      </div>
    );
  }

  // 2. SKELETON PLACEHOLDER VARIANT
  if (effectiveVariant === "skeleton") {
    return (
      <div
        role="status"
        aria-label="Loading content"
        className={`space-y-3 animate-pulse ${className}`}
      >
        <div className="h-6 w-1/3 rounded-xl bg-[var(--bg-surface-secondary)]" />
        <div className="h-24 w-full rounded-2xl bg-[var(--bg-surface-secondary)]" />
        <div className="h-20 w-full rounded-2xl bg-[var(--bg-surface-secondary)]" />
      </div>
    );
  }

  const isModal = effectiveVariant === "modal";
  const isFullScreen = effectiveVariant === "fullScreen";

  // Reusable Road-Trip Car & Copy composition
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 text-center select-none max-w-sm px-6"
    >
      <SplitRupeeRoadTripCar size={isModal ? "sm" : isFullScreen ? "lg" : "md"} />

      <div className="space-y-1 mt-1">
        <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
          {text}
        </h3>
        {isFullScreen && headline && (
          <p className="font-display text-xs sm:text-sm font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
            {headline}
          </p>
        )}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{subtext}</p>
      </div>

      {/* Understated Road Progress Track */}
      <div
        className="w-36 h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden relative mt-1"
        aria-hidden="true"
      >
        <div className="absolute inset-y-0 w-20 rounded-full bg-gradient-to-r from-[var(--brand-primary)] via-[var(--accent-gold)] to-[var(--status-positive)] animate-[sr-indeterminate-progress_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite] motion-reduce:animate-none" />
      </div>
    </div>
  );

  // 3. FULL SCREEN VARIANT
  if (isFullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas)] transition-opacity duration-200 ${className}`}
      >
        {content}
      </div>
    );
  }

  // 4. MODAL VARIANT
  if (isModal) {
    return (
      <div className={`py-4 flex items-center justify-center w-full ${className}`}>
        {content}
      </div>
    );
  }

  // 5. PAGE VARIANT (Default in-page content loading boundary)
  return (
    <div className={`min-h-[45vh] w-full flex items-center justify-center py-10 ${className}`}>
      {content}
    </div>
  );
}
