"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AbstractTravelCanvas from "@/components/AbstractTravelCanvas";
import {
  Compass,
  Mountain,
  Palmtree,
  Sparkles,
  CheckCircle2,
  Train,
  Car,
  Plane,
  Hotel,
  ShieldCheck,
  Clock,
  ArrowRight
} from "lucide-react";

interface CinematicItineraryLoaderProps {
  isOpen: boolean;
  origin: string;
  destination: string;
  nights: number;
  travellers: number;
  budget: number;
  stayBudget?: number;
  apiReady: boolean;
  onComplete: () => void;
  error?: string;
  onDismissError?: () => void;
}

const STAGES = [
  {
    minPct: 0,
    maxPct: 22,
    title: "Mapping Transit Corridors",
    subtitle: "Computing IRCTC rail schedules, flight vectors & highway routes",
    icon: Train,
    tip: "Calculating realistic departure windows with buffer times for zero missed connections."
  },
  {
    minPct: 22,
    maxPct: 45,
    title: "Local Fare & Transit Verification",
    subtitle: "Scanning local prepaid taxi booths, taxi syndicates & regional unions",
    icon: Car,
    tip: "Verifying fair local taxi rates to avoid tourist overcharging."
  },
  {
    minPct: 45,
    maxPct: 72,
    title: "Budget Stay & Lodge Matching",
    subtitle: "Verifying authentic guesthouses, homestays & verified hostels",
    icon: Hotel,
    tip: "Enforcing strict nightly budget limits. Zero fabricated prices or false luxury claims."
  },
  {
    minPct: 72,
    maxPct: 90,
    title: "Pacing & Horizon Timing",
    subtitle: "Aligning morning sunrise points, cultural sights & sunset promenades",
    icon: Compass,
    tip: "Optimizing geographic clusters so you spend less time in transit and more exploring."
  },
  {
    minPct: 90,
    maxPct: 100,
    title: "Your Travel Itinerary is Ready",
    subtitle: "Packaging day-by-day itinerary breakdown, travel tips & packing equipment",
    icon: Sparkles,
    tip: "Finalizing your personalized travel itinerary with comfortable timings and verified stays."
  }
];

export default function CinematicItineraryLoader({
  isOpen,
  origin,
  destination,
  nights,
  travellers,
  budget,
  stayBudget,
  apiReady,
  onComplete,
  error,
  onDismissError
}: CinematicItineraryLoaderProps) {
  const [progress, setProgress] = useState(0);

  // Smooth realistic progression simulation
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    let currentVal = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        let next = prev;

        if (!apiReady) {
          // If API still working, steadily progress up to 92%, slowing as it nears 92%
          if (prev < 30) {
            next = prev + 1.2;
          } else if (prev < 65) {
            next = prev + 0.8;
          } else if (prev < 85) {
            next = prev + 0.5;
          } else if (prev < 93) {
            next = prev + 0.2;
          }
        } else {
          // API is ready! Accelerate smoothly to 100%
          if (prev < 90) {
            next = prev + 3.0;
          } else if (prev < 99) {
            next = prev + 2.0;
          } else {
            next = 100;
          }
        }

        currentVal = Math.min(100, next);
        return currentVal;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isOpen, apiReady]);

  // When 100% is reached and API is ready, pause briefly for celebration, then onComplete
  useEffect(() => {
    if (progress >= 100 && apiReady) {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(finishTimer);
    }
  }, [progress, apiReady, onComplete]);

  if (!isOpen) return null;

  const currentStageIndex = STAGES.findIndex(
    (s) => progress >= s.minPct && progress <= s.maxPct
  );
  const activeStage = STAGES[currentStageIndex !== -1 ? currentStageIndex : STAGES.length - 1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.8 } }}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-black text-white overflow-hidden select-none"
      >
        {/* 60FPS PROCEDURAL MOVING ABSTRACT TRAVEL CANVAS (NO STATIC PICTURE) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AbstractTravelCanvas />

          {/* Cinematic Vignette & Atmospheric Contrast Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
        </div>

        {/* TOP CINEMATIC LETTERBOX BAR */}
        <div className="relative z-10 w-full px-6 md:px-12 py-5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)]">
              <Compass className="h-5 w-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--status-positive)] font-semibold">
                SPLITRUPEE TRAVEL PLANNER
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Real-Time Travel Planning &amp; Local Guide
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <Mountain className="h-3.5 w-3.5 text-[var(--status-positive)]" /> Hills &amp; Peaks
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <Palmtree className="h-3.5 w-3.5 text-[var(--brand-primary)]" /> Coastal Shores
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-sand)]" /> Verified Contacts Only
            </span>
          </div>
        </div>

        {/* MAIN CORE */}
        <div className="relative z-10 mx-auto max-w-4xl w-full px-6 py-6 flex-1 flex flex-col justify-center items-center text-center">
          {/* Route Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
          >
            <span className="font-display text-lg md:text-xl font-semibold text-[var(--text-primary)]">
              {origin}
            </span>
            <ArrowRight className="h-5 w-5 text-[var(--brand-primary)]" />
            <span className="font-display text-lg md:text-xl font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
              {destination}
            </span>
          </motion.div>

          {/* Subtitle Details */}
          <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-8">
            {nights} Nights · {travellers} {travellers > 1 ? "Travellers" : "Traveller"} · Group Target: ₹{budget.toLocaleString()}
            {stayBudget ? ` · Stays: ≤ ₹${stayBudget.toLocaleString()}/night` : ""}
          </p>

          {/* PERCENTAGE DISPLAY */}
          <div className="relative mb-6">
            <div className="relative flex items-baseline justify-center gap-1">
              <span className="font-display text-6xl md:text-7xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                {Math.round(progress)}
              </span>
              <span className="text-2xl md:text-3xl font-semibold text-[var(--brand-primary)]">
                %
              </span>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--status-positive)] font-semibold mt-1">
              {progress >= 100 ? "Travel Plan Ready" : "Checking Real-World Routes & Stays"}
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full max-w-xl mx-auto mb-8">
            <div className="h-3 w-full bg-[var(--bg-surface-secondary)] rounded-full border border-[var(--border-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.1 }}
              />
            </div>
          </div>

          {/* ACTIVE STAGE CARD */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
                    <activeStage.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-semibold text-[var(--text-primary)] text-base text-left">
                    {activeStage.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
                  Phase {currentStageIndex + 1} of {STAGES.length}
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-xs text-left mb-2">
                {activeStage.subtitle}
              </p>
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--status-positive)] text-left flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{activeStage.tip}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 5-STAGE MILESTONE CHECKMARKS */}
          <div className="hidden sm:grid grid-cols-5 gap-2 w-full max-w-2xl mt-8">
            {STAGES.map((s, idx) => {
              const isPast = progress > s.maxPct;
              const isCurrent = progress >= s.minPct && progress <= s.maxPct;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center transition-colors ${
                    isPast
                      ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)] text-[var(--status-positive)]"
                      : isCurrent
                      ? "bg-[var(--bg-surface)] border-[var(--brand-primary)] text-[var(--text-primary)] shadow-[var(--shadow-card)]"
                      : "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)]" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold">
                        0{idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold truncate">
                    {s.title.split(" ")[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message if API fails */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)] text-xs max-w-lg"
            >
              <div className="font-semibold mb-1">Compilation Note:</div>
              <p className="mb-3">{error}</p>
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="px-4 py-1.5 rounded-lg bg-[var(--status-negative)] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
                >
                  Close &amp; Retry
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* BOTTOM TICKER */}
        <div className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[var(--text-secondary)] text-xs border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <span className="h-2 w-2 rounded-full bg-[var(--status-positive)]" />
            <span className="text-[var(--text-primary)] font-medium">
              Confirming Authentic Train Timetables &amp; Regional Routes
            </span>
          </div>
          <div className="text-[11px]">
            Verified Regional Timings · Fair Group Pricing · Comfortable Pacing
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
