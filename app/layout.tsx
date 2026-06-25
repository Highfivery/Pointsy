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

export const metadata: Metadata = {
  applicationName: "Pointsy",
  title: {
    default: "Pointsy — points that make chores fun",
    template: "%s · Pointsy",
  },
  description:
    "A simple, friendly way for families to earn and redeem points. Parents reward good habits; kids watch their points grow.",
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
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <ServiceWorkerUpdater />
      </body>
    </html>
  );
}
