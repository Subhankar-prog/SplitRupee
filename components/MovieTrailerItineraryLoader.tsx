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
    title: "Master Blueprint Compilation",
    desc: "Finalizing day-by-day breakdown and per-person financial allocation...",
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
        exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-slate-950 text-white overflow-hidden select-none"
      >
        {/* ========================================================= */}
        {/* BACKGROUND RADAR & SATELLITE TELEMETRY GRID               */}
        {/* ========================================================= */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Deep ambient dark gradient glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/10 blur-[150px]" />
          <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
          
          {/* Futuristic subtle coordinate grid lines */}
          <div 
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)",
              backgroundSize: "64px 64px"
            }}
          />

          {/* Central Radar Circular Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[780px] md:h-[780px] rounded-full border border-emerald-500/15 flex items-center justify-center pointer-events-none">
            <div className="w-[440px] h-[440px] md:w-[580px] md:h-[580px] rounded-full border border-dashed border-teal-500/20 flex items-center justify-center">
              <div className="w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full border border-emerald-500/25 flex items-center justify-center">
                <div className="w-[140px] h-[140px] md:w-[200px] md:h-[200px] rounded-full border border-dashed border-cyan-500/30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>
            </div>

            {/* Sweeping 360-degree radar beam */}
            <div 
              className="absolute inset-0 rounded-full animate-[spin_6s_linear_infinite]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg 280deg, rgba(16,185,129,0.03) 320deg, rgba(16,185,129,0.18) 360deg)"
              }}
            />
          </div>

          {/* Vignette border */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />
        </div>

        {/* ========================================================= */}
        {/* TOP TELEMETRY HUD BAR                                    */}
        {/* ========================================================= */}
        <header className="relative z-30 w-full px-6 md:px-12 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Compass className="h-5 w-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-emerald-400 font-bold font-mono flex items-center gap-2">
                <span>SPLITRUPEE INTELLIGENCE STUDIO</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 text-[9px] font-mono hidden sm:inline">LIVE TELEMETRY</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-200 font-semibold tracking-wide">
                Route Synthesis Engine • <span className="text-emerald-400 font-mono">v2.4 Ground Truth</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playTelemetrySound(580);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition"
              title="Toggle Sound"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Audio Off</span>
                </>
              )}
            </button>

            {/* Skip Button (active when ready or to bypass) */}
            {apiReady && (
              <button
                onClick={() => {
                  setProgress(100);
                  setIsFinishing(true);
                  onComplete();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold font-mono tracking-wider transition animate-pulse"
              >
                <span>View Plan</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </header>

        {/* ========================================================= */}
        {/* CENTER STAGE: ROUTE SYNTHESIS TRAJECTORY ARC              */}
        {/* ========================================================= */}
        <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 md:px-12 py-6">
          {/* Central Route Map Canvas Card */}
          <div className="w-full max-w-5xl relative">
            {/* Mission Corridor Header Tag */}
            <div className="flex flex-col items-center justify-center text-center mb-6 space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono uppercase tracking-widest font-semibold backdrop-blur-md">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                <span>SYNTHESIZING ACTIVE CORRIDOR</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                  {origin || "Origin City"}
                </span>
                <span className="text-emerald-400 text-lg sm:text-2xl font-light opacity-60">➔</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-300">
                  {destination || "Destination"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {nights} Nights • {travellers} Travellers • Total Budget: ₹{budget?.toLocaleString() || "25,000"}
              </p>
            </div>

            {/* Glowing Trajectory Arc Visual Stage */}
            <div className="relative w-full h-56 sm:h-72 rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-emerald-500/5 flex flex-col justify-between">
              
              {/* Coordinates Grid Overlay */}
              <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-500 flex items-center gap-2">
                <span>LAT/LON TELEMETRY: ACTIVE</span>
                <span className="text-emerald-400">•</span>
                <span>IRCTC CLASS 3A/SL LINKED</span>
              </div>
              <div className="absolute top-3 right-4 text-[10px] font-mono text-emerald-400/80">
                STAY CAP: ≤ ₹{effectiveStay.toLocaleString()}/NIGHT
              </div>

              {/* Trajectory SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background dashed guide arc */}
                <path
                  d="M 12,65 Q 50,22 88,65"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />

                {/* Active glowing progressive route arc */}
                <path
                  d="M 12,65 Q 50,22 88,65"
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="2.2"
                  filter="url(#glow)"
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress}
                  strokeLinecap="round"
                  className="transition-all duration-100 ease-linear"
                />
              </svg>

              {/* Dynamic Beacon moving along the curve */}
              <div
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-100 ease-linear"
                style={{
                  left: `${beaconX}%`,
                  top: `${beaconY}%`
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full bg-emerald-400/30 animate-ping" />
                  <div className="p-2 rounded-full bg-slate-950 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.7)] text-emerald-300">
                    <Plane className="h-4 w-4 transform -rotate-12" />
                  </div>
                </div>
              </div>

              {/* Origin Station Node (Left) */}
              <div className="relative z-10 flex flex-col items-start mt-auto">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">ORIGIN NODE</div>
                    <div className="text-sm sm:text-base font-bold text-white leading-tight">
                      {origin || "Departure"}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 pl-1">
                  Corridor Lock: 100%
                </div>
              </div>

              {/* Midpoint Corridor Checkpoint Tag */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Real-time Transit Calibration</span>
                </div>
              </div>

              {/* Destination Station Node (Right) */}
              <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1 flex-row-reverse text-right">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">DESTINATION TARGET</div>
                    <div className="text-sm sm:text-base font-bold text-white leading-tight">
                      {destination || "Target City"}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 pr-1">
                  {nights} Nights Ground Base
                </div>
              </div>
            </div>

            {/* 3 Telemetry Metrics Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Train className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Transit Routing</div>
                  <div className="text-xs font-semibold text-white">IRCTC Sleeper/3A & Coaches</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Per-Person Split</div>
                  <div className="text-xs font-semibold text-emerald-400">~₹{perPersonBudget.toLocaleString()} / traveller</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Hotel className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Stay Cap Limit</div>
                  <div className="text-xs font-semibold text-slate-200">≤ ₹{effectiveStay.toLocaleString()} / night</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ========================================================= */}
        {/* BOTTOM HUD: PROGRESS BAR & ACTIVE STAGE INDICATOR         */}
        {/* ========================================================= */}
        <footer className="relative z-30 w-full px-6 md:px-12 py-5 bg-slate-950/95 border-t border-white/10 backdrop-blur-2xl">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            
            {/* Top row of footer: Stage description + Big percentage */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                  {React.createElement(currentStage.icon, { className: "h-5 w-5 animate-pulse" })}
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
                    <span>STAGE {currentStageIdx + 1} OF 4</span>
                    <span className="text-slate-600">•</span>
                    <span>{currentStage.title}</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {currentStage.desc}
                  </div>
                </div>
              </div>

              {/* Big Percentage Number */}
              <div className="text-3xl sm:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tabular-nums self-end sm:self-center">
                {Math.round(progress)}%
              </div>
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full relative">
              <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {/* Stage Marker Points along the track */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 px-1">
                {STAGES.map((s, idx) => (
                  <span
                    key={s.title}
                    className={`transition-colors duration-300 flex items-center gap-1 ${
                      idx <= currentStageIdx ? "text-emerald-400 font-semibold" : "text-slate-600"
                    }`}
                  >
                    {idx < currentStageIdx ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
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

        {/* Error Modal Overlay (if API fails) */}
        {error && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <div className="bg-red-950/80 border border-red-500/40 rounded-3xl p-6 max-w-md text-center space-y-4 shadow-2xl">
              <div className="text-red-400 font-mono text-xs uppercase tracking-widest font-bold">
                Generation Exception
              </div>
              <h3 className="text-xl font-bold text-white">Connection Error</h3>
              <p className="text-xs text-red-200">{error}</p>
              <button
                onClick={onDismissError}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
