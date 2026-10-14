import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/userContext";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SplitRupee — Indian Split Expenses app",
  description: "Split expenses, manage group budgets, minimize debts and settle up with friends in India.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <UserProvider>
          <AppShell>{children}</AppShell>
        </UserProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
