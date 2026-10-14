"use client";

import React, { useEffect, useRef } from "react";

export default function TravelAuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initWaypoints();
    };

    window.addEventListener("resize", handleResize);

    // ==========================================
    // 1. TRAVEL WAYPOINTS & FLIGHT ROUTES
    // ==========================================
    interface Waypoint {
      code: string;
      name: string;
      rx: number; // relative 0-1
      ry: number; // relative 0-1
      pulse: number;
    }

    let waypoints: Waypoint[] = [];
    const initWaypoints = () => {
      waypoints = [
        { code: "DEL", name: "Delhi", rx: 0.14, ry: 0.18, pulse: 0 },
        { code: "BOM", name: "Mumbai", rx: 0.08, ry: 0.58, pulse: 1.5 },
        { code: "GOA", name: "Goa", rx: 0.12, ry: 0.82, pulse: 3.0 },
        { code: "BLR", name: "Bengaluru", rx: 0.22, ry: 0.88, pulse: 0.8 },
        { code: "JAI", name: "Jaipur", rx: 0.25, ry: 0.24, pulse: 2.2 },
        { code: "SXR", name: "Srinagar", rx: 0.20, ry: 0.08, pulse: 1.1 },
        { code: "CCU", name: "Kolkata", rx: 0.84, ry: 0.32, pulse: 2.7 },
        { code: "MAA", name: "Chennai", rx: 0.86, ry: 0.78, pulse: 1.8 },
        { code: "IXZ", name: "Andaman", rx: 0.92, ry: 0.88, pulse: 0.4 },
        { code: "DXB", name: "Dubai", rx: 0.76, ry: 0.14, pulse: 2.0 },
        { code: "SIN", name: "Singapore", rx: 0.90, ry: 0.48, pulse: 3.4 }
      ];
    };
    initWaypoints();

    // ==========================================
    // 2. MOVING AIRPLANES ON FLIGHT ARCS
    // ==========================================
    interface Flight {
      start: { x: number; y: number };
      end: { x: number; y: number };
      control: { x: number; y: number };
      progress: number;
      speed: number;
      label: string;
      trail: { x: number; y: number; alpha: number }[];
    }

    const flights: Flight[] = [
      {
        start: { x: width * 0.06, y: height * 0.22 },
        end: { x: width * 0.94, y: height * 0.32 },
        control: { x: width * 0.5, y: height * 0.05 },
        progress: 0.15,
        speed: 0.0011,
        label: "DEL ✈ SIN",
        trail: []
      },
      {
        start: { x: width * 0.92, y: height * 0.82 },
        end: { x: width * 0.08, y: height * 0.42 },
        control: { x: width * 0.48, y: height * 0.62 },
        progress: 0.58,
        speed: 0.00095,
        label: "GOA ✈ BOM",
        trail: []
      },
      {
        start: { x: width * 0.12, y: height * 0.88 },
        end: { x: width * 0.85, y: height * 0.14 },
        control: { x: width * 0.58, y: height * 0.42 },
        progress: 0.82,
        speed: 0.00085,
        label: "BLR ✈ DXB",
        trail: []
      },
      {
        start: { x: width * 0.75, y: height * 0.12 },
        end: { x: width * 0.18, y: height * 0.90 },
        control: { x: width * 0.35, y: height * 0.35 },
        progress: 0.35,
        speed: 0.0009,
        label: "DXB ✈ MAA",
        trail: []
      }
    ];

    // Helper: Quadratic Bezier Point
    const getBezierPoint = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      return {
        x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
        y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
      };
    };

    // Helper: Quadratic Bezier Angle
    const getBezierAngle = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => {
      const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
      const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
      return Math.atan2(dy, dx);
    };

    // ==========================================
    // 3. AMBIENT TRAVEL PARTICLES / STARDUST
    // ==========================================
    interface Stardust {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      phase: number;
    }

    const particles: Stardust[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.6 + 0.25,
        baseAlpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }

    let time = 0;

    // ==========================================
    // RENDER LOOP (Subtle, Lite, Moving Travel Sky)
    // ==========================================
    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // --- A. NON-BLACK, LUMINOUS TWILIGHT DEEP NAVY BASE GRADIENT ---
      // Distinctly blue-slate, airy, not solid pitch black
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0c1e38"); // deep sapphire navy top
      bgGrad.addColorStop(0.35, "#10294c"); // lighter horizon twilight
      bgGrad.addColorStop(0.7, "#0d223f"); // luminous slate navy
      bgGrad.addColorStop(1, "#091b32"); // oceanic base
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // --- B. SOFT SHIFTING AURORA / ATMOSPHERIC GLOWS ---
      // Moving emerald aurora wave
      const auroraX = (Math.sin(time * 0.4) * 0.25 + 0.5) * width;
      const auroraY = height * 0.25;
      const auroraGrad = ctx.createRadialGradient(
        auroraX,
        auroraY,
        40,
        auroraX,
        auroraY,
        width * 0.6
      );
      auroraGrad.addColorStop(0, "rgba(16, 185, 129, 0.14)"); // emerald glow
      auroraGrad.addColorStop(0.45, "rgba(56, 189, 248, 0.10)"); // cyan sky glow
      auroraGrad.addColorStop(1, "transparent");
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary soft teal pulse at bottom
      const pulseX = (Math.cos(time * 0.3) * 0.2 + 0.5) * width;
      const pulseGrad = ctx.createRadialGradient(
        pulseX,
        height * 0.85,
        20,
        pulseX,
        height * 0.85,
        width * 0.5
      );
      pulseGrad.addColorStop(0, "rgba(45, 212, 191, 0.10)");
      pulseGrad.addColorStop(1, "transparent");
      ctx.fillStyle = pulseGrad;
      ctx.fillRect(0, 0, width, height);

      // --- C. ROTATING TRAVEL COMPASS & RADAR VECTOR ---
      ctx.save();
      const compassX = width * 0.5;
      const compassY = height * 0.48;
      const compassRadius = Math.min(width * 0.44, 440);

      ctx.strokeStyle = "rgba(52, 211, 153, 0.08)";
      ctx.lineWidth = 1;

      // Outer navigation circle
      ctx.beginPath();
      ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Middle circle with dashed border
      ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
      ctx.setLineDash([5, 9]);
      ctx.beginPath();
      ctx.arc(compassX, compassY, compassRadius * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Slow rotating compass crosshair ticks
      ctx.save();
      ctx.translate(compassX, compassY);
      ctx.rotate(time * 0.04);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.10)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const x1 = Math.cos(ang) * (compassRadius - 16);
        const y1 = Math.sin(ang) * (compassRadius - 16);
        const x2 = Math.cos(ang) * (compassRadius + 8);
        const y2 = Math.sin(ang) * (compassRadius + 8);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();

      // --- D. UNDULATING TOPOGRAPHIC CONTOUR WAVES AT HORIZON ---
      // Topographic Layer 1
      ctx.save();
      ctx.strokeStyle = "rgba(52, 211, 153, 0.12)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.78);
      for (let x = 0; x <= width; x += 25) {
        const y =
          height * 0.78 +
          Math.sin(x * 0.003 + time * 0.5) * 22 +
          Math.cos(x * 0.006 - time * 0.3) * 12;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Topographic Layer 2
      ctx.strokeStyle = "rgba(56, 189, 248, 0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.88);
      for (let x = 0; x <= width; x += 25) {
        const y =
          height * 0.88 +
          Math.cos(x * 0.004 - time * 0.4) * 20 +
          Math.sin(x * 0.008 + time * 0.6) * 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // --- E. FLIGHT ROUTE ARCS ---
      flights.forEach((flight) => {
        // Draw curved dashed flight route line
        ctx.save();
        ctx.strokeStyle = "rgba(45, 212, 191, 0.22)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(flight.start.x, flight.start.y);
        ctx.quadraticCurveTo(
          flight.control.x,
          flight.control.y,
          flight.end.x,
          flight.end.y
        );
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Advance flight progress
        flight.progress += flight.speed;
        if (flight.progress > 1) {
          flight.progress = 0;
          flight.trail = [];
        }

        const currentPos = getBezierPoint(
          flight.start,
          flight.control,
          flight.end,
          flight.progress
        );
        const currentAngle = getBezierAngle(
          flight.start,
          flight.control,
          flight.end,
          flight.progress
        );

        // Add to contrail
        flight.trail.push({ x: currentPos.x, y: currentPos.y, alpha: 0.85 });
        if (flight.trail.length > 40) flight.trail.shift();

        // Draw jet contrail
        ctx.save();
        for (let i = 0; i < flight.trail.length - 1; i++) {
          const p1 = flight.trail[i];
          const p2 = flight.trail[i + 1];
          p1.alpha *= 0.98;
          ctx.strokeStyle = `rgba(167, 243, 208, ${p1.alpha * 0.45})`;
          ctx.lineWidth = Math.max(0.8, (i / flight.trail.length) * 2.4);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        ctx.restore();

        // Draw sleek minimalist airplane
        ctx.save();
        ctx.translate(currentPos.x, currentPos.y);
        ctx.rotate(currentAngle);

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 10;

        // Fuselage
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swept Wings
        ctx.beginPath();
        ctx.moveTo(1, 0);
        ctx.lineTo(-5, -11);
        ctx.lineTo(-2, -11);
        ctx.lineTo(4, 0);
        ctx.lineTo(-2, 11);
        ctx.lineTo(-5, 11);
        ctx.closePath();
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-13, -5);
        ctx.lineTo(-11, -5);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();

        // Beacon blink
        if (Math.floor(time * 6) % 2 === 0) {
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(9, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // --- F. AIRPORT WAYPOINT NODES & LABELS ---
      waypoints.forEach((wp) => {
        const wx = wp.rx * width;
        const wy = wp.ry * height;
        wp.pulse += 0.025;

        const pulseScale = (Math.sin(wp.pulse) + 1) * 0.5;
        const pulseRadius = 3 + pulseScale * 9;
        const pulseAlpha = (1 - pulseScale) * 0.5;

        // Pulsing radar ring
        ctx.strokeStyle = `rgba(52, 211, 153, ${pulseAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wx, wy, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Node dot
        ctx.fillStyle = "rgba(52, 211, 153, 0.9)";
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(wx, wy, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node airport label (subtle monospace)
        ctx.fillStyle = "rgba(226, 232, 240, 0.65)";
        ctx.font = "600 10px 'Poppins', monospace, sans-serif";
        ctx.fillText(wp.code, wx + 6, wy + 3);
      });

      // --- G. GENTLE DRIFTING AMBIENT PARTICLES (STARDUST) ---
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.02;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const curAlpha =
          p.baseAlpha + Math.sin(p.phase) * (p.baseAlpha * 0.6);
        ctx.fillStyle = `rgba(167, 243, 208, ${Math.max(0.1, curAlpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: "block" }}
      />
      {/* Central soft vignette overlay to give the glowing auth card maximum clarity */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,21,41,0.15)_0%,rgba(9,20,38,0.45)_100%)] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
