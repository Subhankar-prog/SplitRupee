import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Trip Planner & Itinerary Generator — Route & Cost Estimation",
  description:
    "Plan multi-day travel itineraries with daily hotel caps, transport transit options, printable travel guides, and instant group expense ledger sync.",
  alternates: {
    canonical: "/itinerary",
  },
  openGraph: {
    title: "AI Trip Planner & Itinerary Generator | SplitRupee",
    description:
      "Plan destinations, routes, hotel caps, and day-by-day activities. Export printable magazine guides and sync trip costs to your group ledger.",
    url: "https://splitrupee.vercel.app/itinerary",
    siteName: "SplitRupee",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Trip Planner & Itinerary Generator | SplitRupee",
    description:
      "Plan destinations, routes, hotel caps, and day-by-day activities with SplitRupee.",
  },
};

export default function ItineraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
