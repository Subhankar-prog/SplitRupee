"use client";

import React, { useEffect, useRef } from "react";

export default function AbstractTravelCanvas() {
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
      initStars();
      initMountains();
    };

    window.addEventListener("resize", handleResize);

    // ==========================================
    // 1. STARS & SHOOTING STARS
    // ==========================================
    interface Star {
      x: number;
      y: number;
      size: number;
      alpha: number;
      speed: number;
    }
    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const count = Math.floor(width * 0.08);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.55),
          size: Math.random() * 1.8 + 0.5,
          alpha: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.03 + 0.01
        });
      }
    };
    initStars();

    interface ShootingStar {
      x: number;
      y: number;
      len: number;
      speed: number;
      angle: number;
      opacity: number;
      active: boolean;
    }
    const shootingStars: ShootingStar[] = [];
    const triggerShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.7 + width * 0.1,
        y: Math.random() * (height * 0.25),
        len: Math.random() * 100 + 60,
        speed: Math.random() * 8 + 9,
        angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
        opacity: 1,
        active: true
      });
    };

    // ==========================================
    // 2. PROCEDURAL MOUNTAIN PEAKS
    // ==========================================
    interface MountainPeak {
      points: { x: number; y: number }[];
      color1: string;
      color2: string;
      lineColor: string;
    }
    let mountainRanges: MountainPeak[] = [];

    const initMountains = () => {
      mountainRanges = [];

      // Layer 1: Distant majestic jagged peaks
      const pts1: { x: number; y: number }[] = [];
      const baseY1 = height * 0.46;
      pts1.push({ x: 0, y: height });
      pts1.push({ x: 0, y: baseY1 });

      const step1 = Math.max(30, width / 24);
      for (let x = 0; x <= width + step1; x += step1) {
        // Jagged peak variation
        const peakHeight = Math.sin(x * 0.003) * 90 + Math.cos(x * 0.008) * 60 + Math.sin(x * 0.015) * 40;
        pts1.push({ x, y: baseY1 - peakHeight });
      }
      pts1.push({ x: width, y: height });
      mountainRanges.push({
        points: pts1,
        color1: "rgba(15, 23, 42, 0.95)",
        color2: "rgba(30, 41, 59, 0.9)",
        lineColor: "rgba(56, 189, 248, 0.35)"
      });

      // Layer 2: Mid-distance ridges with wireframe contour
      const pts2: { x: number; y: number }[] = [];
      const baseY2 = height * 0.54;
      pts2.push({ x: 0, y: height });
      pts2.push({ x: 0, y: baseY2 });

      const step2 = Math.max(40, width / 18);
      for (let x = 0; x <= width + step2; x += step2) {
        const peakHeight = Math.cos(x * 0.004 + 1.2) * 80 + Math.sin(x * 0.007) * 50;
        pts2.push({ x, y: baseY2 - peakHeight });
      }
      pts2.push({ x: width, y: height });
      mountainRanges.push({
        points: pts2,
        color1: "rgba(10, 25, 47, 0.96)",
        color2: "rgba(6, 78, 59, 0.85)",
        lineColor: "rgba(52, 211, 153, 0.4)"
      });
    };
    initMountains();

    // ==========================================
    // 3. MOVING BIRDS FORMATION
    // ==========================================
    interface Bird {
      x: number;
      y: number;
      speed: number;
      wingAngle: number;
      wingSpeed: number;
      size: number;
    }
    const birds: Bird[] = [];
    for (let i = 0; i < 6; i++) {
      birds.push({
        x: -i * 35 - 50,
        y: height * 0.22 + (i % 2 === 0 ? i * 12 : -i * 12),
        speed: 1.8 + Math.random() * 0.3,
        wingAngle: 0,
        wingSpeed: 0.12 + Math.random() * 0.04,
        size: 7 + (i % 3) * 2
      });
    }

    // ==========================================
    // 4. MOVING EXPEDITION AIRPLANE WITH CONTRAIL
    // ==========================================
    let planeX = -100;
    let planeY = height * 0.16;
    let planeAngle = 0;
    interface ContrailPoint {
      x: number;
      y: number;
      alpha: number;
    }
    const contrail: ContrailPoint[] = [];

    // ==========================================
    // 5. AMBIENT FLOATING EMBER / FIREFLY PARTICLES
    // ==========================================
    interface Firefly {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      pulseSpeed: number;
    }
    const fireflies: Firefly[] = [];
    for (let i = 0; i < 45; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height * 0.5 + Math.random() * (height * 0.5),
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.5 - 0.3,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        pulseSpeed: Math.random() * 0.05 + 0.02
      });
    }

    let time = 0;
    let lastShootingStarTime = 0;

    // ==========================================
    // MAIN 60FPS ANIMATION LOOP
    // ==========================================
    const render = () => {
      time += 0.015;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // --- A. DYNAMIC SKY GRADIENT WITH MOVING AURORA ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#030712"); // deep midnight void
      skyGrad.addColorStop(0.3, "#071728"); // twilight navy
      skyGrad.addColorStop(0.5, "#0b2c3d"); // horizon cyan
      skyGrad.addColorStop(0.7, "#083344"); // dusk teal
      skyGrad.addColorStop(1, "#022c22"); // deep emerald
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Shifting Aurora Borealis / Sunset Wave in Sky
      const auroraX = (Math.sin(time * 0.5) * 0.2 + 0.5) * width;
      const auroraGrad = ctx.createRadialGradient(
        auroraX,
        height * 0.25,
        10,
        auroraX,
        height * 0.3,
        width * 0.6
      );
      auroraGrad.addColorStop(0, "rgba(52, 211, 153, 0.18)"); // emerald glow
      auroraGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.12)"); // cyan glow
      auroraGrad.addColorStop(1, "transparent");
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height * 0.6);

      // Celestial Sun / Moon with Corona Glow
      const sunX = width * 0.78;
      const sunY = height * 0.18;
      const coronaPulse = Math.sin(time * 1.5) * 6 + 48;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, coronaPulse * 2.5);
      sunGlow.addColorStop(0, "rgba(253, 224, 71, 0.85)"); // bright warm yellow
      sunGlow.addColorStop(0.3, "rgba(251, 146, 60, 0.35)"); // orange corona
      sunGlow.addColorStop(1, "transparent");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, coronaPulse * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Solid Sun Disc
      ctx.fillStyle = "rgba(254, 240, 138, 0.95)";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
      ctx.fill();

      // --- B. DRAW STARS ---
      stars.forEach((s) => {
        s.alpha += Math.sin(time * 2 + s.x) * 0.005;
        const curAlpha = Math.max(0.1, Math.min(1, s.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${curAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Periodic Shooting Stars
      if (Date.now() - lastShootingStarTime > 2800) {
        triggerShootingStar();
        lastShootingStarTime = Date.now();
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) continue;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= 0.016;

        const tailX = ss.x - Math.cos(ss.angle) * ss.len;
        const tailY = ss.y - Math.sin(ss.angle) * ss.len;

        const ssGrad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        ssGrad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        ssGrad.addColorStop(0.4, `rgba(56, 189, 248, ${ss.opacity * 0.6})`);
        ssGrad.addColorStop(1, "transparent");

        ctx.strokeStyle = ssGrad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
          shootingStars.splice(i, 1);
        }
      }

      // --- C. ROTATING EXPEDITION RADAR / COMPASS VECTOR ---
      ctx.save();
      const compassCenterX = width * 0.5;
      const compassCenterY = height * 0.42;
      const radarRadius = Math.min(width * 0.35, 340);

      // Concentric circles
      ctx.strokeStyle = "rgba(52, 211, 153, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(compassCenterX, compassCenterY, radarRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(compassCenterX, compassCenterY, radarRadius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Sweeping radar beam
      const radarAngle = time * 0.8;
      const radarSweep = ctx.createRadialGradient(
        compassCenterX,
        compassCenterY,
        0,
        compassCenterX,
        compassCenterY,
        radarRadius
      );
      radarSweep.addColorStop(0, "rgba(52, 211, 153, 0.12)");
      radarSweep.addColorStop(1, "transparent");
      ctx.fillStyle = radarSweep;
      ctx.beginPath();
      ctx.moveTo(compassCenterX, compassCenterY);
      ctx.arc(compassCenterX, compassCenterY, radarRadius, radarAngle, radarAngle + 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- D. DRAW MOUNTAIN PEAKS & CONTOUR LINES ---
      mountainRanges.forEach((range, rIdx) => {
        ctx.save();
        const mGrad = ctx.createLinearGradient(0, height * 0.35, 0, height * 0.7);
        mGrad.addColorStop(0, range.color2);
        mGrad.addColorStop(1, range.color1);
        ctx.fillStyle = mGrad;

        ctx.beginPath();
        range.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();

        // Shimmering neon contour edge on ridges
        ctx.strokeStyle = range.lineColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = range.lineColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let idx = 1; idx < range.points.length - 1; idx++) {
          const pt = range.points[idx];
          if (idx === 1) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();

        // Animated horizontal topographic contour lines on mountains
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
        ctx.lineWidth = 1;
        const lineOffset = (time * 15 * (rIdx + 1)) % 25;
        for (let ly = height * 0.45 + lineOffset; ly < height * 0.65; ly += 25) {
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(width, ly);
          ctx.stroke();
        }
        ctx.restore();
      });

      // --- E. PROCEDURAL ROLLING HILLS (UNDULATING WAVES) ---
      // Hill Layer 1 (Upper green tea terrace hill)
      ctx.save();
      const hill1Grad = ctx.createLinearGradient(0, height * 0.52, 0, height * 0.8);
      hill1Grad.addColorStop(0, "rgba(6, 95, 70, 0.95)"); // lush emerald
      hill1Grad.addColorStop(1, "rgba(2, 44, 34, 0.98)");
      ctx.fillStyle = hill1Grad;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.6);
      for (let x = 0; x <= width; x += 15) {
        const y =
          height * 0.62 +
          Math.sin(x * 0.005 + time * 0.8) * 35 +
          Math.cos(x * 0.002 - time * 0.4) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Glowing neon edge for Hill 1
      ctx.strokeStyle = "rgba(52, 211, 153, 0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Hill Layer 2 (Lower soft rolling slope)
      ctx.save();
      const hill2Grad = ctx.createLinearGradient(0, height * 0.62, 0, height);
      hill2Grad.addColorStop(0, "rgba(4, 120, 87, 0.95)");
      hill2Grad.addColorStop(1, "rgba(6, 78, 59, 1)");
      ctx.fillStyle = hill2Grad;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.7);
      for (let x = 0; x <= width; x += 15) {
        const y =
          height * 0.71 +
          Math.cos(x * 0.004 - time * 0.9) * 30 +
          Math.sin(x * 0.003 + time * 0.6) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- F. PROCEDURAL OCEAN SWELLS & BEACH WAVES (FOREGROUND) ---
      // Deep Ocean swell
      ctx.save();
      const waveGrad1 = ctx.createLinearGradient(0, height * 0.78, 0, height);
      waveGrad1.addColorStop(0, "rgba(14, 116, 144, 0.88)"); // cyan ocean
      waveGrad1.addColorStop(1, "rgba(8, 47, 73, 0.98)");
      ctx.fillStyle = waveGrad1;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.8);
      for (let x = 0; x <= width; x += 12) {
        const y =
          height * 0.82 +
          Math.sin(x * 0.008 + time * 2.2) * 22 +
          Math.cos(x * 0.004 + time * 1.4) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Foreground Surf & Wave Crest with Foam Ripples
      ctx.save();
      const waveGrad2 = ctx.createLinearGradient(0, height * 0.86, 0, height);
      waveGrad2.addColorStop(0, "rgba(45, 212, 191, 0.75)"); // teal wave crest
      waveGrad2.addColorStop(0.3, "rgba(13, 148, 136, 0.9)");
      waveGrad2.addColorStop(1, "rgba(4, 47, 46, 1)"); // deep sea floor
      ctx.fillStyle = waveGrad2;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.89);
      for (let x = 0; x <= width; x += 10) {
        const y =
          height * 0.89 +
          Math.sin(x * 0.012 - time * 2.8) * 16 +
          Math.sin(x * 0.02 + time * 1.8) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Wave Foam / Bioluminescent light shimmer on wave crest
      ctx.strokeStyle = "rgba(204, 251, 241, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#5eead4";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Beach Golden Sand Horizon at extreme base
      ctx.save();
      const sandGrad = ctx.createLinearGradient(0, height * 0.95, 0, height);
      sandGrad.addColorStop(0, "rgba(217, 119, 6, 0.45)"); // warm golden beach
      sandGrad.addColorStop(1, "rgba(180, 83, 9, 0.95)");
      ctx.fillStyle = sandGrad;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.96);
      for (let x = 0; x <= width; x += 20) {
        const y = height * 0.96 + Math.sin(x * 0.005 + time) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- G. FLOCK OF FLYING MIGRATORY BIRDS ---
      birds.forEach((b) => {
        b.x += b.speed;
        b.wingAngle += b.wingSpeed;
        if (b.x > width + 60) {
          b.x = -60;
          b.y = height * 0.2 + Math.random() * (height * 0.18);
        }

        const wingYOffset = Math.sin(b.wingAngle) * (b.size * 0.6);

        ctx.strokeStyle = "rgba(241, 245, 249, 0.75)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        // Left wing
        ctx.moveTo(b.x - b.size, b.y + wingYOffset);
        ctx.quadraticCurveTo(b.x - b.size * 0.5, b.y - b.size * 0.3, b.x, b.y);
        // Right wing
        ctx.quadraticCurveTo(b.x + b.size * 0.5, b.y - b.size * 0.3, b.x + b.size, b.y + wingYOffset);
        ctx.stroke();
      });

      // --- H. EXPEDITION AIRPLANE & CONTRAIL ---
      planeX += 2.2;
      planeY = height * 0.14 + Math.sin(time * 0.6) * 16;
      planeAngle = Math.cos(time * 0.6) * 0.08;

      if (planeX > width + 120) {
        planeX = -120;
        contrail.length = 0;
      }

      // Add contrail point
      contrail.push({ x: planeX - 25, y: planeY, alpha: 0.8 });
      if (contrail.length > 70) contrail.shift();

      // Draw dashed luminous contrail
      ctx.save();
      for (let i = 0; i < contrail.length - 1; i++) {
        const p1 = contrail[i];
        const p2 = contrail[i + 1];
        p1.alpha *= 0.985;
        ctx.strokeStyle = `rgba(167, 243, 208, ${p1.alpha * 0.55})`;
        ctx.lineWidth = Math.max(1, (i / contrail.length) * 3);
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // Draw stylized airplane
      ctx.save();
      ctx.translate(planeX, planeY);
      ctx.rotate(planeAngle);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 12;

      ctx.beginPath();
      // Fuselage
      ctx.ellipse(0, 0, 16, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-8, -14);
      ctx.lineTo(-3, -14);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 14);
      ctx.lineTo(-8, 14);
      ctx.closePath();
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-15, -6);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();

      // Blinking beacon light
      if (Math.floor(time * 8) % 2 === 0) {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(14, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- I. AMBIENT RISING FIREFLIES & LIGHT PARTICLES ---
      fireflies.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.alpha += Math.sin(time * 3 + f.x) * f.pulseSpeed;

        if (f.y < height * 0.3) {
          f.y = height * 0.95;
          f.x = Math.random() * width;
        }

        const curAlpha = Math.max(0.1, Math.min(0.9, f.alpha));
        ctx.fillStyle = `rgba(52, 211, 153, ${curAlpha})`;
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: "block" }}
    />
  );
}
