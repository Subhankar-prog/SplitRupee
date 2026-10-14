"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
  Film
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

// 4 Sequential Full-Motion 4K Video Clips (4.5s each on a SINGLE slide)
// Scene 1: Mountain Peaks / Himalayas
// Scene 2: Friends Trekking & Hiking in Wilds
// Scene 3: Tropical Beach & Ocean Waves
// Scene 4: Evening Bonfire & Campfire Under Stars
const TRAILER_VIDEOS = [
  {
    id: 1,
    name: "Himalayan Mountain Peaks",
    videoId: "BL3n1mDhNTM",
    start: 3,
    poster: "/images/trailer/trailer_1_train.jpg",
    statusNote: "Verifying high-altitude mountain corridors & platform connections..."
  },
  {
    id: 2,
    name: "Friends Trekking in Wilderness",
    videoId: "R1PrQGXKJ7Q",
    start: 12,
    poster: "/images/trailer/trailer_2_trekking.jpg",
    statusNote: "Mapping trail elevations, permit checkpoints & trekking pacing..."
  },
  {
    id: 3,
    name: "Coastal Shores & Ocean Waves",
    videoId: "f68kS5hFCBA",
    start: 2,
    poster: "/images/trailer/trailer_4_beach.jpg",
    statusNote: "Filtering beachside homestays & verified prepaid cabs..."
  },
  {
    id: 4,
    name: "Evening Campfire Under Stars",
    videoId: "Y0g5pgs8v5A",
    start: 2,
    poster: "/images/trailer/trailer_6_campfire.jpg",
    statusNote: "Locking verified nightly stays matching your exact budget limit..."
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
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isOutro, setIsOutro] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle synth chime
  const playCinematicSound = (type: "whoosh" | "chime") => {
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
      if (type === "whoosh") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "chime") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      }
    } catch {
      // Audio autoplay policy
    }
  };

  // Reset state when opened
  useEffect(() => {
    if (!isOpen) {
      setCurrentVideoIdx(0);
      setProgress(0);
      setIsOutro(false);
      return;
    }

    setCurrentVideoIdx(0);
    setProgress(0);
    setIsOutro(false);
  }, [isOpen]);

  // Sequential video switcher: Each video plays for 4.5 seconds one by one on the single slide!
  // Video 1 (Mountain Peaks): 0 to 4.5s
  // Video 2 (Friends Trekking): 4.5 to 9.0s
  // Video 3 (Beach & Waves): 9.0 to 13.5s
  // Video 4 (Campfire & Stars): 13.5 to 18.0s
  // Finish & Load Page: ~19s
  useEffect(() => {
    if (!isOpen) return;

    const timer1 = setTimeout(() => {
      setCurrentVideoIdx(1); // Friends Trekking
      playCinematicSound("whoosh");
    }, 4500);

    const timer2 = setTimeout(() => {
      setCurrentVideoIdx(2); // Beach & Waves
      playCinematicSound("whoosh");
    }, 9000);

    const timer3 = setTimeout(() => {
      setCurrentVideoIdx(3); // Campfire Under Stars
      playCinematicSound("whoosh");
    }, 13500);

    const timerOutro = setTimeout(() => {
      setIsOutro(true);
      playCinematicSound("chime");
    }, 18000);

    const timerFinish = setTimeout(() => {
      onComplete(); // Page loads!
    }, 19500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerOutro);
      clearTimeout(timerFinish);
    };
  }, [isOpen, onComplete]);

  // Smooth continuous progress bar across the 18 seconds
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 99) {
          return prev + 0.55;
        }
        return 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentVideo = TRAILER_VIDEOS[currentVideoIdx];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-black text-white overflow-hidden select-none"
      >
        {/* ========================================================= */}
        {/* TOP CINEMATIC 21:9 LETTERBOX BAR                         */}
        {/* ========================================================= */}
        <div className="relative z-30 w-full px-6 md:px-12 py-3.5 flex items-center justify-between bg-black/95 border-b border-white/10 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Compass className="h-4 w-4 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 font-bold font-mono flex items-center gap-2">
                <span>SPLITRUPEE CINEMA STUDIO</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                <span className="text-red-400 text-[9px] font-semibold">4K FOOTAGE</span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {origin} <span className="text-emerald-400">➔</span> {destination} • Compiling Expedition Itinerary
              </div>
            </div>
          </div>

          {/* Sound & Stream Badge */}
          <div className="movie-trailer-top-controls flex items-center gap-3">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playCinematicSound("whoosh");
              }}
              className="movie-trailer-sound-toggle-button flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-slate-200 transition"
              title="Toggle Audio Effects"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> Sound ON
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" /> Sound Muted
                </>
              )}
            </button>

            <span className="movie-trailer-loading-pill hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-semibold">
              <Film className="h-3.5 w-3.5 text-emerald-400" /> LOADING
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SINGLE CINEMATIC SLIDE: 4 VIDEOS PLAY ONE BY ONE          */}
        {/* ========================================================= */}
        <div className="movie-trailer-cinematic-slide-stage relative z-10 flex-1 w-full h-full flex flex-col items-center justify-center overflow-hidden">
          {/* VIDEO CONTAINER */}
          <div className="movie-trailer-videos-canvas absolute inset-0 w-full h-full overflow-hidden z-0">
            {TRAILER_VIDEOS.map((video, idx) => (
              <div
                key={video.id}
                className={`movie-trailer-video-item absolute inset-0 w-full h-full transition-opacity duration-1000 ${currentVideoIdx === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                {/* Instant High-Res Poster Fallback */}
                <div
                  className="movie-trailer-video-poster absolute inset-0 bg-cover bg-center filter brightness-[0.75] scale-105"
                  style={{ backgroundImage: `url('${video.poster}')` }}
                />

                {/* Pre-streamed Video Player with pointer-events-none */}
                <iframe
                  className="movie-trailer-video-iframe w-[130vw] h-[130vh] -top-[15vh] -left-[15vw] absolute object-cover filter brightness-[0.88] contrast-[1.08] saturate-[1.12] pointer-events-none select-none"
                  src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${video.videoId}&start=${video.start}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
                  title={video.name}
                  tabIndex={-1}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}

            {/* TRANSPARENT CLICK SHIELD (Completely absorbs clicks/hovers to block YouTube pause button) */}
            <div className="movie-trailer-click-shield absolute inset-0 z-20 pointer-events-auto cursor-default bg-transparent" />

            {/* Cinematic Letterbox Depth Vignettes */}
            <div className="movie-trailer-vignette-vertical absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/60 pointer-events-none z-20" />
            <div className="movie-trailer-vignette-radial absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] pointer-events-none z-20" />
          </div>

          {/* SINGLE SLIDE COMPILATION TICKER (Bottom Left) */}
          {!isOutro && (
            <div className="absolute left-6 md:left-12 bottom-28 max-w-xl z-30 pointer-events-none">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-emerald-500/40 backdrop-blur-md text-emerald-400 text-xs font-mono font-bold tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>COMPILING EXPEDITION ITINERARY</span>
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                  Ground Truth Verification in Progress
                </h2>

                <p className="text-xs text-slate-200 font-medium drop-shadow">
                  {currentVideo.statusNote}
                </p>
              </div>
            </div>
          )}

          {/* CLIMAX OUTRO (At 100%): MASTER BLUEPRINT READY */}
          <AnimatePresence>
            {isOutro && (
              <motion.div
                key="outro-screen"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6 bg-black/95 backdrop-blur-2xl"
              >
                <div className="absolute w-[700px] h-[700px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none" />

                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="space-y-4 max-w-xl"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold tracking-widest uppercase">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% COMPILED
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 tracking-tight font-serif drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                    MASTER BLUEPRINT READY
                  </h1>

                  <p className="text-sm text-slate-300 font-medium tracking-wide">
                    0% Dummy Numbers • 100% Real Regional Ground Truth • Transparent Group Total
                  </p>

                  <div className="pt-2 text-xs font-mono text-emerald-400 tracking-widest uppercase font-bold animate-pulse">
                    UNVEILING ITINERARY STUDIO CANVAS...
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ERROR NOTIFICATION OVERLAY (IF API FAILS) */}
          {error && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg">
              <div className="bg-red-950/80 border border-red-500/40 rounded-2xl p-6 max-w-md text-center space-y-4">
                <div className="text-red-400 font-mono text-xs uppercase tracking-widest font-bold">
                  Generation Exception
                </div>
                <h3 className="text-xl font-bold text-white">Connection Failed</h3>
                <p className="text-xs text-red-200">{error}</p>
                <button
                  onClick={onDismissError}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider transition"
                >
                  Close & Return
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* BOTTOM CINEMATIC 21:9 LETTERBOX BAR WITH PROGRESS HUD     */}
        {/* ========================================================= */}
        <div className="movie-trailer-bottom-hud relative z-30 w-full px-6 md:px-12 py-4 bg-black/95 border-t border-white/10 backdrop-blur-2xl">
          <div className="movie-trailer-hud-content flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Progress Percentage & Status */}
            <div className="movie-trailer-status-summary flex items-center gap-4">
              <div className="movie-trailer-percentage-display text-3xl md:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tabular-nums">
                {Math.round(progress)}%
              </div>
              <div className="movie-trailer-trip-summary-text">
                <div className="movie-trailer-compiling-label text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>COMPILING TRAVEL ITINERARY</span>
                </div>
                <div className="movie-trailer-trip-details-text text-xs text-slate-300 font-medium">
                  {origin} <span className="text-emerald-400">➔</span> {destination} • {nights} Nights • {travellers} Travellers
                  {stayBudget ? ` • ≤ ₹${stayBudget.toLocaleString()}/night stay limit` : ""}
                </div>
              </div>
            </div>

            {/* Stages Progression Tracker */}
            <div className="movie-trailer-progress-track-wrapper flex flex-col gap-1.5 w-full sm:w-80">
              <div className="movie-trailer-progress-track-bg w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="movie-trailer-progress-fill-bar h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              <div className="movie-trailer-progress-labels flex justify-between text-[10px] font-mono text-slate-400">
                <span className="movie-trailer-label-left text-emerald-400">LIVE 4K TRAILER</span>
                <span className="movie-trailer-label-right">AI EXPEDITION COMPILER</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
