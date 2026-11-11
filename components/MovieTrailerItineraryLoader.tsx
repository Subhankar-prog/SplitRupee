"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  MapPin,
  Train,
  Plane,
  Car,
  Hotel,
  Wallet,
  Sparkles,
  CheckCircle2,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

interface MovieTrailerItineraryLoaderProps {
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
    pct: 25,
    title: "Ground Transit Synthesis",
    desc: "Scanning IRCTC coach classes, state RTC routes & local taxi syndicates...",
    icon: Train
  },
  {
    pct: 55,
    title: "Accommodation Cap Calibration",
    desc: "Filtering verified stays matching your exact nightly limit...",
    icon: Hotel
  },
  {
    pct: 82,
    title: "Sightseeing & Daylight Pacing",
    desc: "Sequencing monuments, scenic viewpoints & regional meal stops...",
    icon: Navigation
  },
  {
    pct: 100,
    title: "Your Travel Itinerary is Ready",
    desc: "Finalizing day-by-day itinerary breakdown and per-person financial allocation...",
    icon: ShieldCheck
  }
];

export default function MovieTrailerItineraryLoader({
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
}: MovieTrailerItineraryLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle high-tech futuristic sound
  const playTelemetrySound = (freq = 520, duration = 0.12) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  };

  // Reset when opened
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStageIdx(0);
      setIsFinishing(false);
      return;
    }
    setProgress(5);
    setCurrentStageIdx(0);
    setIsFinishing(false);
  }, [isOpen]);

  // Smooth realistic telemetry progress loop
  useEffect(() => {
    if (!isOpen || isFinishing) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // If API is ready, accelerate smoothly to 100%
        if (apiReady) {
          const next = prev + 5;
          if (next >= 100) {
            setIsFinishing(true);
            return 100;
          }
          return next;
        }

        // Natural progress cruising up to 88% while waiting for API
        if (prev < 30) return prev + 1.2;
        if (prev < 60) return prev + 0.8;
        if (prev < 88) return prev + 0.4;
        return 88; // Hold at 88% until API is confirmed
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isOpen, apiReady, isFinishing]);

  // Update stage index based on progress
  useEffect(() => {
    if (progress < 25) {
      setCurrentStageIdx(0);
    } else if (progress < 55) {
      if (currentStageIdx === 0) playTelemetrySound(640);
      setCurrentStageIdx(1);
    } else if (progress < 82) {
      if (currentStageIdx === 1) playTelemetrySound(780);
      setCurrentStageIdx(2);
    } else {
      if (currentStageIdx === 2) playTelemetrySound(960);
      setCurrentStageIdx(3);
    }
  }, [progress, currentStageIdx]);

  // Trigger completion once finished
  useEffect(() => {
    if (isFinishing && progress >= 100) {
      playTelemetrySound(1040, 0.3);
      const timer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isFinishing, progress, onComplete]);

  if (!isOpen) return null;

  const currentStage = STAGES[currentStageIdx];
  const perPersonBudget = Math.round((budget || 25000) / (travellers || 2));
  const effectiveStay = stayBudget || Math.round(((budget || 25000) * 0.4) / (nights || 4));

  // Trajectory arc math for animated beacon along curve
  const t = Math.min(progress / 100, 1);
  // Parabolic trajectory: X goes 12% -> 88%, Y arches upward
  const beaconX = 12 + t * 76;
  const beaconY = 60 - Math.sin(t * Math.PI) * 28;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden select-none"
      >
        {/* Subtle architectural dot backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* TOP BAR */}
        <header className="relative z-30 w-full px-6 md:px-12 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
              <Compass className="h-5 w-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--status-positive)] font-semibold flex items-center gap-2">
                <span>SPLITRUPEE TRIP PLANNER</span>
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold">
                Route Synthesis Engine · <span className="text-[var(--brand-primary)] font-mono">Verified Schedules</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playTelemetrySound(580);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] transition-colors"
              title="Toggle Sound"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-[var(--status-positive)]" />
                  <span className="hidden sm:inline">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <span className="hidden sm:inline">Audio Off</span>
                </>
              )}
            </button>

            {apiReady && (
              <button
                type="button"
                onClick={() => {
                  setProgress(100);
                  setIsFinishing(true);
                  onComplete();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D] text-xs font-semibold hover:opacity-95 transition-opacity"
              >
                <span>View Plan</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </header>

        {/* CENTER STAGE: ROUTE TRAJECTORY */}
        <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 md:px-12 py-6">
          <div className="w-full max-w-4xl relative">
            <div className="flex flex-col items-center justify-center text-center mb-6 space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-[11px] font-semibold uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" />
                <span>Building Your Route</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-tight flex flex-wrap items-center justify-center gap-3">
                <span>{origin || "Origin City"}</span>
                <span className="text-[var(--brand-primary)] font-normal">&rarr;</span>
                <span className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                  {destination || "Destination"}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                {nights} Nights · {travellers} Travellers · Total Budget: ₹{budget?.toLocaleString() || "25,000"}
              </p>
            </div>

            {/* Route Card */}
            <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between">
              <div className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                <span>IRCTC Class &amp; Highway Timing Check</span>
                <span className="text-[var(--status-positive)] font-semibold tabular-nums">
                  Stay Cap: ≤ ₹{effectiveStay.toLocaleString()}/night
                </span>
              </div>

              <svg className="w-full h-24 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path
                  d="M 10,75 Q 50,15 90,75"
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
                <path
                  d="M 10,75 Q 50,15 90,75"
                  fill="none"
                  stroke="var(--brand-primary)"
                  strokeWidth="2.5"
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress}
                  strokeLinecap="round"
                  className="transition-all duration-100 ease-linear"
                />
              </svg>

              <div className="flex items-end justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Origin</div>
                    <div className="font-semibold text-[var(--text-primary)]">{origin || "Departure"}</div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                  <Zap className="h-3 w-3 text-[var(--accent-sand)]" />
                  <span>Daylight Pacing Check</span>
                </div>

                <div className="flex items-center gap-2 flex-row-reverse text-right">
                  <div className="p-2 rounded-lg bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Destination</div>
                    <div className="font-semibold text-[var(--text-primary)]">{destination || "Target City"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Metrics Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
                  <Train className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Transit Routing</div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Rail &amp; Local Cabs</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Per-Person Split</div>
                  <div className="text-xs font-semibold text-[var(--status-positive)] tabular-nums">~₹{perPersonBudget.toLocaleString()} / traveller</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-warning-bg)] text-[var(--status-warning)]">
                  <Hotel className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Stay Cap Limit</div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">≤ ₹{effectiveStay.toLocaleString()} / night</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* BOTTOM PROGRESS BAR */}
        <footer className="relative z-30 w-full px-6 md:px-12 py-5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] shrink-0">
                  {React.createElement(currentStage.icon, { className: "h-5 w-5" })}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--status-positive)] flex items-center gap-2">
                    <span>STAGE {currentStageIdx + 1} OF 4</span>
                    <span>·</span>
                    <span>{currentStage.title}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {currentStage.desc}
                  </div>
                </div>
              </div>

              <div className="font-display text-2xl sm:text-3xl font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] tabular-nums self-end sm:self-center">
                {Math.round(progress)}%
              </div>
            </div>

            <div className="w-full relative">
              <div className="w-full h-2 rounded-full bg-[var(--bg-surface-secondary)] overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] mt-2 px-1">
                {STAGES.map((s, idx) => (
                  <span
                    key={s.title}
                    className={`transition-colors flex items-center gap-1 ${
                      idx <= currentStageIdx ? "text-[var(--status-positive)] font-semibold" : "opacity-60"
                    }`}
                  >
                    {idx < currentStageIdx ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    )}
                    <span className="hidden md:inline">{s.title}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </footer>

        {/* Error Modal Overlay */}
        {error && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[var(--overlay-backdrop)] backdrop-blur-sm">
            <div className="bg-[var(--bg-surface)] border border-[var(--status-negative-border)] rounded-2xl p-6 max-w-md text-center space-y-4 shadow-[var(--shadow-popover)]">
              <div className="text-[var(--status-negative)] text-xs uppercase tracking-wider font-semibold">
                Generation Notice
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Connection Error</h3>
              <p className="text-xs text-[var(--text-secondary)]">{error}</p>
              <button
                type="button"
                onClick={onDismissError}
                className="h-9 px-5 rounded-xl bg-[var(--status-negative)] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
              >
                Close &amp; Return
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
