import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/userContext";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SplitRupee — Indian Splitwise for Shared Expenses",
  description: "Split expenses, manage group budgets, minimize debts and settle up with friends in India.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

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
      </body>
    </html>
  );
}
