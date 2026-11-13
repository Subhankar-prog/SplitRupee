export interface BotanicalAvatarSwatch {
  name: string;
  hex: string;
}

/**
 * Curated Warm Modern Fintech swatches harmonized with Light & Dark tokens.
 * Every swatch clears WCAG AA (>= 4.5:1) with white (#FFFFFF) foreground initials.
 */
export const BOTANICAL_AVATAR_COLORS: BotanicalAvatarSwatch[] = [
  { name: "Terracotta", hex: "#AD5434" },
  { name: "Warm Clay", hex: "#9A4E47" },
  { name: "Sage Pine", hex: "#4D6143" },
  { name: "River Slate", hex: "#4B5D6F" },
  { name: "Warm Umber", hex: "#7B5B4A" },
  { name: "Aged Ochre", hex: "#8F5A12" },
  { name: "Deep Espresso", hex: "#463D33" },
  { name: "Muted Rust", hex: "#A33D35" },
];

export const DEFAULT_AVATAR_COLOR = "#AD5434";

function parseHexColor(color?: string | null): [number, number, number] | null {
  if (!color) return null;
  const clean = color.trim().replace(/^#/, "");
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Picks whichever ink (#FFFFFF or #171613) achieves higher WCAG contrast on the
 * given avatar fill, so both new curated swatches and legacy stored hex colors
 * remain readable without mutating database records.
 */
export function getAvatarTextColor(bgHex?: string | null): "#FFFFFF" | "#171613" {
  const rgb = parseHexColor(bgHex);
  if (!rgb) return "#FFFFFF";
  const lum =
    0.2126 * channelLuminance(rgb[0]) +
    0.7152 * channelLuminance(rgb[1]) +
    0.0722 * channelLuminance(rgb[2]);
  const whiteContrast = 1.05 / (lum + 0.05);
  const darkLum = 0.2126 * channelLuminance(23) + 0.7152 * channelLuminance(22) + 0.0722 * channelLuminance(19);
  const darkContrast = (lum + 0.05) / (darkLum + 0.05);
  return darkContrast > whiteContrast ? "#171613" : "#FFFFFF";
}

