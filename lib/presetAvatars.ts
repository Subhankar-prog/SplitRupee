export interface PresetAvatar {
  id: string;
  name: string;
  url: string;
  category: "animal" | "nature" | "fintech" | "celestial";
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: "tiger", name: "Royal Tiger", url: "/avatars/avatar-1.svg", category: "animal" },
  { id: "fox", name: "Swift Fox", url: "/avatars/avatar-2.svg", category: "animal" },
  { id: "owl", name: "Wise Owl", url: "/avatars/avatar-3.svg", category: "animal" },
  { id: "falcon", name: "Sky Falcon", url: "/avatars/avatar-4.svg", category: "animal" },
  { id: "lotus", name: "Zen Lotus", url: "/avatars/avatar-5.svg", category: "nature" },
  { id: "mountain", name: "Alpine Peak", url: "/avatars/avatar-6.svg", category: "nature" },
  { id: "rupee", name: "Rupee Coin", url: "/avatars/avatar-7.svg", category: "fintech" },
  { id: "compass", name: "Explorer Compass", url: "/avatars/avatar-8.svg", category: "nature" },
  { id: "sparkle", name: "Cosmic Sparkle", url: "/avatars/avatar-9.svg", category: "celestial" },
  { id: "shield", name: "Security Shield", url: "/avatars/avatar-10.svg", category: "fintech" },
  { id: "phoenix", name: "Sun Phoenix", url: "/avatars/avatar-11.svg", category: "celestial" },
  { id: "wave", name: "Ocean Wave", url: "/avatars/avatar-12.svg", category: "nature" },
];

export function isPresetAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  return PRESET_AVATARS.some((p) => p.url === url);
}
