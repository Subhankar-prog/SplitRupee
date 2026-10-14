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
    title: "Ground Truth Intelligence",
    subtitle: "Scanning local prepaid taxi booths, taxi syndicates & regional unions",
    icon: Car,
    tip: "Grounding local transfer rates to prevent tourist overcharging."
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
    title: "Master Blueprint Synthesis",
    subtitle: "Packaging group expense breakdown, travel tips & packing equipment",
    icon: Sparkles,
    tip: "Finalizing your elite travel blueprint with 100% verified ground intelligence."
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
        <div className="relative z-10 w-full px-6 md:px-12 py-5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Compass className="h-5 w-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-emerald-400 font-bold">
                SPLITRUPEE EXPEDITION ENGINE
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Autonomous Real-Time Travel Agency & Local Guide
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              <Mountain className="h-3.5 w-3.5 text-emerald-400" /> Hills & Peaks
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              <Palmtree className="h-3.5 w-3.5 text-teal-400" /> Coastal Shores
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Verified Contacts Only
            </span>
          </div>
        </div>

        {/* MAIN CINEMATIC CORE */}
        <div className="relative z-10 mx-auto max-w-4xl w-full px-6 py-6 flex-1 flex flex-col justify-center items-center text-center">
          {/* Animated Route Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-emerald-950/50"
          >
            <span className="text-lg md:text-xl font-extrabold text-white tracking-wide">
              {origin}
            </span>
            <ArrowRight className="h-5 w-5 text-emerald-400 animate-pulse" />
            <span className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300 tracking-wide">
              {destination}
            </span>
          </motion.div>

          {/* Subtitle Details */}
          <p className="text-xs md:text-sm text-slate-300 font-medium tracking-wider uppercase mb-8">
            {nights} Nights • {travellers} {travellers > 1 ? "Travellers" : "Traveller"} • Group Target: ₹{budget.toLocaleString()}
            {stayBudget ? ` • Stays: ≤ ₹${stayBudget.toLocaleString()}/night` : ""}
          </p>

          {/* GIANT PERCENTAGE PROGRESS DISPLAY */}
          <div className="relative mb-8">
            <div className="relative flex items-baseline justify-center gap-1">
              <span className="text-7xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] font-mono">
                {Math.round(progress)}
              </span>
              <span className="text-3xl md:text-4xl font-bold text-emerald-400 font-mono">
                %
              </span>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/90 font-semibold mt-1">
              {progress >= 100 ? "Expedition Blueprint Completed" : "Compiling Real-Time Ground Intelligence"}
            </div>
          </div>

          {/* HIGH-END GLOWING PROGRESS BAR */}
          <div className="w-full max-w-xl mx-auto mb-8">
            <div className="h-3.5 w-full bg-slate-950/80 rounded-full border border-white/10 p-0.5 overflow-hidden backdrop-blur-lg shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 relative shadow-[0_0_15px_rgba(52,211,153,0.7)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.1 }}
              >
                {/* Shimmer light line */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
          </div>

          {/* ACTIVE STAGE CARD */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-black/80"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <activeStage.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-base text-left">
                    {activeStage.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Phase {currentStageIndex + 1} of {STAGES.length}
                </span>
              </div>
              <p className="text-slate-300 text-xs text-left mb-2">
                {activeStage.subtitle}
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] text-emerald-300/90 text-left flex items-start gap-1.5 italic">
                <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-teal-400" />
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
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isPast
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : isCurrent
                      ? "bg-slate-900/80 border-cyan-400/50 text-white shadow-lg shadow-cyan-950/50"
                      : "bg-slate-950/40 border-white/5 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
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
              className="mt-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs max-w-lg"
            >
              <div className="font-bold mb-1">Compilation Note:</div>
              <p className="mb-3">{error}</p>
              {onDismissError && (
                <button
                  onClick={onDismissError}
                  className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 font-semibold transition"
                >
                  Close & Retry
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* BOTTOM CINEMATIC TICKER */}
        <div className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs border-t border-white/10 bg-black/60 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">
              Synchronizing with Verified Ground Databases & IRCTC Railway Nodes
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Zero Hallucinated Numbers • Transparent Group Pricing • Full Screen Studio
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
