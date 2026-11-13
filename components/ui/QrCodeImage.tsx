"use client";

import React, { useEffect, useState } from "react";
import { Loader2, QrCode, RefreshCw, WifiOff } from "lucide-react";

interface QrCodeImageProps {
  src: string;
  alt: string;
  size: number;
  className?: string;
  fallbackLabel?: string;
  fallbackValue?: string;
}

/**
 * Renders external QR codes inside fixed square dimensions to avoid layout shift,
 * with loading indicator, offline detection, error recovery, and copyable text fallback.
 */
export default function QrCodeImage({
  src,
  alt,
  size,
  className = "",
  fallbackLabel = "QR preview unavailable",
  fallbackValue,
}: QrCodeImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [isOffline, setIsOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const syncOnlineState = () => {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setIsOffline(offline);
      if (!offline && src) {
        setStatus("loading");
        setAttempt((n) => n + 1);
      }
    };

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, [src]);

  useEffect(() => {
    if (!isOffline && src) {
      setStatus("loading");
    }
  }, [src, isOffline]);

  const showFallback = isOffline || status === "error" || !src;

  const handleRetry = () => {
    const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
    setIsOffline(offlineNow);
    if (offlineNow) return;
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  if (showFallback) {
    return (
      <div
        role="status"
        style={{ width: size, minHeight: size }}
        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#958573] bg-[#F6EFE3] p-2.5 text-center text-[#29251F]"
      >
        {isOffline ? (
          <WifiOff className="h-5 w-5 text-[#8F5A12] shrink-0" aria-hidden="true" />
        ) : (
          <QrCode className="h-5 w-5 text-[#645A4F] shrink-0" aria-hidden="true" />
        )}
        <span className="text-[11px] font-semibold leading-tight text-[#29251F]">
          {isOffline ? "QR unavailable offline" : fallbackLabel}
        </span>
        {fallbackValue && (
          <span className="max-w-full truncate font-mono text-[10px] text-[#645A4F]" title={fallbackValue}>
            {fallbackValue}
          </span>
        )}
        <button
          type="button"
          onClick={handleRetry}
          className="mt-0.5 inline-flex min-h-[32px] items-center gap-1 rounded-md border border-[#958573] bg-[#FFFAF2] px-2.5 py-1 text-[10px] font-semibold text-[#29251F] hover:bg-[#E9D8C3] transition-colors"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          <span>Retry QR</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center overflow-hidden"
    >
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#F6EFE3] text-[#645A4F]"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[10px] font-medium">Loading QR</span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${src}-${attempt}`}
        src={src}
        alt={alt}
        width={size}
        height={size}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`h-full w-full object-contain transition-opacity duration-150 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </div>
  );
}

