import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@/lib/userContext";
import { ThemeProvider } from "@/lib/themeContext";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import Script from "next/script";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/manrope-latin.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SplitRupee: Personal & Group Expense Management",
  description:
    "Split expenses, manage group budgets, minimize debts, and settle up via UPI with calm clarity.",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6EFE3" },
    { media: "(prefers-color-scheme: dark)", color: "#171613" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`light ${inter.variable} ${manrope.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('splitrupee_theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var resolved = (saved === 'light' || saved === 'dark') ? saved : (prefersDark ? 'dark' : 'light');
                if (resolved === 'dark') {
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
