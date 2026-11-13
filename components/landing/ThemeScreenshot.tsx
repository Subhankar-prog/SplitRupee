import React from "react";

interface ThemeScreenshotProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  mobileLightSrc?: string;
  mobileDarkSrc?: string;
  mobileWidth?: number;
  mobileHeight?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Renders the approved Light or Dark SplitRupee product screenshot cleanly
 * using CSS theme visibility so there is zero hydration flash across themes.
 */
export default function ThemeScreenshot({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  mobileLightSrc,
  mobileDarkSrc,
  mobileWidth,
  mobileHeight,
  priority = false,
  className = "",
}: ThemeScreenshotProps) {
  const loadingAttr = "eager";
  const fetchPriorityAttr = priority ? "high" : undefined;
  const hasMobileVariant = Boolean(mobileLightSrc && mobileDarkSrc && mobileWidth && mobileHeight);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      {hasMobileVariant && (
        <div className="block sm:hidden">
          <img
            src={mobileLightSrc}
            alt={alt}
            width={mobileWidth}
            height={mobileHeight}
            loading={loadingAttr}
            decoding="sync"
            {...(fetchPriorityAttr ? { fetchPriority: fetchPriorityAttr } : {})}
            className="block dark:hidden w-full h-auto"
          />
          <img
            src={mobileDarkSrc}
            alt={alt}
            width={mobileWidth}
            height={mobileHeight}
            loading={loadingAttr}
            decoding="sync"
            {...(fetchPriorityAttr ? { fetchPriority: fetchPriorityAttr } : {})}
            className="hidden dark:block w-full h-auto"
          />
        </div>
      )}

      <div className={hasMobileVariant ? "hidden sm:block" : "block"}>
        <img
          src={lightSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loadingAttr}
          decoding="sync"
          {...(fetchPriorityAttr ? { fetchPriority: fetchPriorityAttr } : {})}
          className="block dark:hidden w-full h-auto"
        />
        <img
          src={darkSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loadingAttr}
          decoding="sync"
          {...(fetchPriorityAttr ? { fetchPriority: fetchPriorityAttr } : {})}
          className="hidden dark:block w-full h-auto"
        />
      </div>
    </div>
  );
}

