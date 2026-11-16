import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SplitRupee Pro — AI Receipt Scanner & Automated Recurring Bills",
  description:
    "Upgrade to SplitRupee Pro for automated AI receipt OCR scanning and recurring monthly household bills on top of our 100% free core expense ledger.",
  alternates: {
    canonical: "/pro",
  },
  openGraph: {
    title: "SplitRupee Pro — Advanced Splitting & Automation",
    description:
      "AI receipt scanning and automated monthly recurring bills on top of a 100% free core group expense ledger.",
    url: "https://splitrupee.vercel.app/pro",
    siteName: "SplitRupee",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitRupee Pro — Advanced Splitting & Automation",
    description:
      "AI receipt scanning and automated monthly recurring bills on top of a 100% free core group expense ledger.",
  },
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
