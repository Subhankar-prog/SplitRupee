import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/userContext";
import { ThemeProvider } from "@/lib/themeContext";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SplitRupee — Indian Split Expenses app",
  description: "Split expenses, manage group budgets, minimize debts and settle up with friends in India.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SplitRupee",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f7f4ed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('splitrupee_theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <UserProvider>
            <AppShell>{children}</AppShell>
          </UserProvider>
        </ThemeProvider>
        <PwaRegister />
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
