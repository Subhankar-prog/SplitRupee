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

const BASE_URL = "https://splitrupee.vercel.app";
const DEFAULT_TITLE = "SplitRupee — Split Expenses, Manage Group Bills & Plan Trips";
const DEFAULT_DESCRIPTION =
  "Split expenses with friends, track shared bills, manage group settlements and plan trips with SplitRupee.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | SplitRupee",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "SplitRupee",
  authors: [{ name: "SplitRupee Team", url: BASE_URL }],
  creator: "SplitRupee",
  publisher: "SplitRupee",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SplitRupee",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    siteName: "SplitRupee",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/showcase/hero-standing-light.png",
        width: 1200,
        height: 630,
        alt: "SplitRupee Group Expense Management & UPI Settlement",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/images/showcase/hero-standing-light.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      process.env.GOOGLE_SITE_VERIFICATION ||
      undefined,
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

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "SplitRupee",
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-IN",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "SplitRupee",
    url: BASE_URL,
    logo: `${BASE_URL}/icon.svg`,
    description: "Non-custodial group expense management and 1-tap UPI settlements across India.",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/#application`,
    name: "SplitRupee",
    url: BASE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android, iOS",
    description:
      "Split expenses, manage group budgets, minimize debts with graph simplification, and settle up via UPI.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  },
];

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
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
