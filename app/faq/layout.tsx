import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — UPI Settlements, Security & Offline Mode",
  description:
    "Find answers to common questions about 1-tap UPI deep links, smart debt simplification, non-custodial security, and offline expense tracking in SplitRupee.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | SplitRupee",
    description:
      "Answers to top questions on UPI deep links, debt minimization, placeholder friend accounts, and offline capability.",
    url: "https://splitrupee.vercel.app/faq",
    siteName: "SplitRupee",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | SplitRupee",
    description:
      "Answers to top questions on UPI deep links, debt minimization, and offline capability in SplitRupee.",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
