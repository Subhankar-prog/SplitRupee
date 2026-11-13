"use client";

import { useEffect, useRef } from "react";

/**
 * High-Performance Scroll Reveal Hook
 * Uses IntersectionObserver to reveal elements when scrolled into view.
 * - Triggers once, then unobserves to preserve 60fps performance
 * - Progressive enhancement: gracefully defaults to visible if IO is unavailable
 * - Honors prefers-reduced-motion
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If reduced-motion is preferred, reveal immediately
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      el.classList.add("sr-revealed");
      return;
    }

    // Fallback if IntersectionObserver is unsupported
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      el.classList.add("sr-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (options?.delay) {
              setTimeout(() => {
                entry.target.classList.add("sr-revealed");
              }, options.delay);
            } else {
              entry.target.classList.add("sr-revealed");
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin, options?.delay]);

  return ref;
}

/**
 * Attaches a single shared IntersectionObserver to any container's children
 * matching `[data-sr-reveal]`.
 */
export function useSharedScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      container
        .querySelectorAll("[data-sr-reveal]")
        .forEach((el) => el.classList.add("sr-revealed"));
      return;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      container
        .querySelectorAll("[data-sr-reveal]")
        .forEach((el) => el.classList.add("sr-revealed"));
      return;
    }

    const targets = container.querySelectorAll("[data-sr-reveal]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sr-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, []);

  return containerRef;
}

