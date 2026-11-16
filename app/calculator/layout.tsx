import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Bill Split & Tip Calculator — Instant Math with GST",
  description:
    "Split restaurant bills, cafe orders, GST, and tips equally or by exact item shares with zero signup. Copy payment shares directly to WhatsApp.",
  alternates: {
    canonical: "/calculator",
  },
  openGraph: {
    title: "Free Bill Split & Tip Calculator | SplitRupee",
    description:
      "Calculate equal or itemized dish shares plus GST and tips with zero signup needed. Share formatted amounts on WhatsApp.",
    url: "https://splitrupee.vercel.app/calculator",
    siteName: "SplitRupee",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Bill Split & Tip Calculator | SplitRupee",
    description:
      "Calculate equal or itemized dish shares plus GST and tips with zero signup needed.",
  },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
