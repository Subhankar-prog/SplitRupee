import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support — Group Help, Pro Requests & Feedback",
  description:
    "Get in touch with the SplitRupee team for help with group ledgers, SplitRupee Pro access requests, or feature feedback.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Support | SplitRupee",
    description:
      "Need assistance with a group split, have feedback, or want Pro access? Contact the SplitRupee team directly.",
    url: "https://splitrupee.vercel.app/contact",
    siteName: "SplitRupee",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Support | SplitRupee",
    description:
      "Get in touch with the SplitRupee team for group ledger support, Pro requests, or feedback.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
