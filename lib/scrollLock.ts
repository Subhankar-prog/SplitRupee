"use client";

import { useEffect, useRef } from "react";

interface SavedStyles {
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyWidth: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
}

let activeLockCount = 0;
let savedScrollY = 0;
let savedScrollX = 0;
let savedStyles: SavedStyles | null = null;

export function getActiveScrollLockCount(): number {
  return activeLockCount;
}

export function getSavedScrollPosition(): { x: number; y: number } {
  return { x: savedScrollX, y: savedScrollY };
}

export function resetScrollLock(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    activeLockCount = 0;
    savedScrollY = 0;
    savedScrollX = 0;
    savedStyles = null;
    return;
  }

  if (savedStyles) {
    document.documentElement.style.overflow = savedStyles.htmlOverflow;
    document.documentElement.removeAttribute("data-sr-scroll-locked");

    document.body.style.position = savedStyles.bodyPosition;
    document.body.style.top = savedStyles.bodyTop;
    document.body.style.left = savedStyles.bodyLeft;
    document.body.style.width = savedStyles.bodyWidth;
    document.body.style.overflow = savedStyles.bodyOverflow;
    document.body.style.paddingRight = savedStyles.bodyPaddingRight;
  }

  activeLockCount = 0;
  savedScrollY = 0;
  savedScrollX = 0;
  savedStyles = null;
}

export function acquireScrollLock(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (activeLockCount === 0) {
    // 1. Record exact current scroll position before modifying DOM
    savedScrollY = window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
    savedScrollX = window.scrollX ?? window.pageXOffset ?? document.documentElement.scrollLeft ?? 0;

    // 2. Measure scrollbar width to prevent horizontal layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // 3. Save existing styles
    savedStyles = {
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
    };

    // 4. Apply locking styles
    document.documentElement.style.overflow = "hidden";
    document.documentElement.setAttribute("data-sr-scroll-locked", "true");

    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = `-${savedScrollX}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  activeLockCount++;
}

export function releaseScrollLock(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (activeLockCount <= 0) {
    activeLockCount = 0;
    return;
  }

  activeLockCount--;

  if (activeLockCount === 0 && savedStyles) {
    const y = savedScrollY;
    const x = savedScrollX;
    const styles = savedStyles;

    // 1. Restore styles
    document.documentElement.style.overflow = styles.htmlOverflow;
    document.documentElement.removeAttribute("data-sr-scroll-locked");

    document.body.style.position = styles.bodyPosition;
    document.body.style.top = styles.bodyTop;
    document.body.style.left = styles.bodyLeft;
    document.body.style.width = styles.bodyWidth;
    document.body.style.overflow = styles.bodyOverflow;
    document.body.style.paddingRight = styles.bodyPaddingRight;

    savedStyles = null;

    // 2. Restore exact scroll position
    try {
      window.scrollTo({
        top: y,
        left: x,
        behavior: "instant" as ScrollBehavior,
      });
    } catch {
      window.scrollTo(x, y);
    }
  }
}

/**
 * Hook to lock background scroll when an overlay is open.
 * Uses reference counting so nested overlays don't prematurely unlock the body.
 * Resilient to React 18 Strict Mode and unmounts.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const isHeldRef = useRef(false);

  useEffect(() => {
    if (isLocked && !isHeldRef.current) {
      acquireScrollLock();
      isHeldRef.current = true;
    } else if (!isLocked && isHeldRef.current) {
      releaseScrollLock();
      isHeldRef.current = false;
    }

    return () => {
      if (isHeldRef.current) {
        releaseScrollLock();
        isHeldRef.current = false;
      }
    };
  }, [isLocked]);
}

