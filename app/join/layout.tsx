import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Group",
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

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
