import type { Metadata, Viewport } from "next";
import { Inter, Sora, Geist_Mono } from "next/font/google";
import { ServiceWorkerUpdater } from "@/components/pwa/ServiceWorkerUpdater";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://pointsy.kids";
const TAGLINE = "Pointsy — points that make chores fun";
const DESCRIPTION =
  "Pointsy is a free, open-source family chores app. Parents reward good habits with points; kids watch their points grow and redeem them for rewards you set. No ads, no tracking, no cost.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Pointsy",
  title: {
    default: TAGLINE,
    template: "%s · Pointsy",
  },
  description: DESCRIPTION,
  keywords: [
    "family chores app",
    "kids reward chart",
    "chore points for kids",
    "allowance app",
    "reward chart app",
    "free chore app",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Pointsy",
    url: SITE_URL,
    title: TAGLINE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TAGLINE,
    description: DESCRIPTION,
  },
  // iOS uses apple-touch-icon (not the manifest) for the Home Screen icon.
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Pointsy",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#04130e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Site-wide entity. A consistent Organization node (with `sameAs`) is the
// highest-leverage signal for being recognised as a real entity by search and
// AI assistants — see SPEC / launch strategy.
const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pointsy",
  legalName: "Highfivery LLC",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  description: DESCRIPTION,
  sameAs: ["https://highfivery.com", "https://github.com/Highfivery/Pointsy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${geistMono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <ServiceWorkerUpdater />
      </body>
    </html>
  );
}
