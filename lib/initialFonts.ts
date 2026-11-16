export interface InitialFontStyle {
  id: string;
  name: string;
  className: string;
  description: string;
}

export const INITIAL_FONT_STYLES: InitialFontStyle[] = [
  {
    id: "funky",
    name: "Funky Slant",
    className: "avatar-font-funky",
    description: "Bold angled italic letterforms with subtle shadow",
  },
  {
    id: "comic",
    name: "Retro Pop",
    className: "avatar-font-comic",
    description: "Heavy blocky display letters with punchy tilt",
  },
  {
    id: "stencil",
    name: "Cyber Mono",
    className: "avatar-font-stencil",
    description: "Monospaced tech stencil letterforms",
  },
  {
    id: "groovy",
    name: "Chunky Groovy",
    className: "avatar-font-groovy",
    description: "Bold rounded vintage display letters",
  },
  {
    id: "serif",
    name: "Editorial Serif",
    className: "avatar-font-serif",
    description: "Luxury high-contrast italic serif",
  },
  {
    id: "modern",
    name: "Clean Neo",
    className: "avatar-font-modern",
    description: "Geometric architectural sans",
  },
];

export const DEFAULT_INITIAL_FONT = "funky";

export function getInitialFontClass(fontId?: string | null): string {
  if (!fontId) return "avatar-font-funky";
  const cleanId = fontId.replace(/^font:/, "");
  const found = INITIAL_FONT_STYLES.find((f) => f.id === cleanId);
  return found ? found.className : "avatar-font-funky";
}

export function getInitials(name?: string | null): string {
  const cleanName = (name || "User").trim();
  if (!cleanName) return "U";
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}
