"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DEFAULT_AVATAR_COLOR, getAvatarTextColor } from "@/lib/avatarColors";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | string;
export type AvatarShape = "rounded" | "circle" | "square";

export interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  avatarColor?: string | null;
  size?: AvatarSize;
  shape?: AvatarShape;
  isPro?: boolean;
  className?: string;
  imgClassName?: string;
  alt?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

const SIZE_MAP: Record<string, { container: string; text: string }> = {
  xs: { container: "h-6 w-6 min-w-6", text: "text-[10px]" },
  sm: { container: "h-7 w-7 min-w-7", text: "text-xs" },
  md: { container: "h-8 w-8 min-w-8", text: "text-xs font-medium" },
  lg: { container: "h-10 w-10 min-w-10", text: "text-sm font-semibold" },
  xl: { container: "h-12 w-12 min-w-12", text: "text-base font-semibold" },
  "2xl": { container: "h-16 w-16 min-w-16", text: "text-xl font-semibold" },
  "3xl": { container: "h-20 w-20 min-w-20", text: "text-2xl font-display font-semibold" },
};

const SHAPE_MAP: Record<AvatarShape, string> = {
  rounded: "rounded-xl",
  square: "rounded-lg",
  circle: "rounded-full",
};

/**
 * SplitRupee Reusable Accessible User Avatar
 *
 * Implements strict 3-tier avatar priority:
 * 1. User-uploaded custom avatar (or provided avatarUrl)
 * 2. Google profile picture
 * 3. Initials-based botanical fallback
 *
 * Seamlessly handles broken/expired Google URLs with zero layout shift
 * and strict referrer policy to prevent Google 403 Forbidden hotlink errors.
 */
export default function UserAvatar({
  name = "User",
  avatarUrl,
  avatarColor,
  size = "md",
  shape = "rounded",
  isPro = false,
  className = "",
  imgClassName = "",
  alt,
  referrerPolicy = "no-referrer",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the URL changes (e.g. after upload or sync)
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const cleanName = (name || "User").trim();

  // Compute initials (up to 2 letters)
  const initials = useMemo(() => {
    if (!cleanName) return "U";
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }, [cleanName]);

  const sizeStyles = SIZE_MAP[size] || {
    container: size,
    text: "text-xs font-semibold",
  };

  const shapeClass = SHAPE_MAP[shape] || SHAPE_MAP.rounded;

  const resolvedColor = isPro
    ? "var(--accent-gold)"
    : avatarColor || DEFAULT_AVATAR_COLOR;

  const resolvedTextColor = isPro
    ? "#171613"
    : getAvatarTextColor(resolvedColor);

  const hasValidImage = Boolean(avatarUrl && avatarUrl.trim() && !imgError);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden transition-all ${shapeClass} ${sizeStyles.container} ${className}`}
      style={{
        backgroundColor: resolvedColor,
        color: resolvedTextColor,
      }}
      aria-label={alt || `${cleanName}'s avatar`}
      role="img"
    >
      {hasValidImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl!}
          alt={alt || cleanName}
          referrerPolicy={referrerPolicy}
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className={`h-full w-full object-cover rounded-[inherit] transition-opacity duration-200 ${imgClassName}`}
        />
      ) : (
        <span
          className={`leading-none select-none tracking-tight ${sizeStyles.text}`}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
}

