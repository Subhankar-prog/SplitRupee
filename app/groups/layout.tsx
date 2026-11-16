import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups",
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

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
