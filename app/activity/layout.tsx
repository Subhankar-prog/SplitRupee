import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity & Audit Trail",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
