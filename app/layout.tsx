import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaSetup } from "@/components/pwa-setup";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SkoraCares — Smarter Patient & Clinic Management",
    template: "%s · SkoraCares",
  },
  description:
    "Online Prescription Upload, Multi Clinic Management, Home Visit with Map Integration — everything your practice needs in one powerful platform.",
  keywords: [
    "clinic management",
    "healthcare software",
    "patient records",
    "online prescriptions",
    "doctor appointment",
  ],
  openGraph: {
    title: "SkoraCares — Smarter Patient & Clinic Management",
    description:
      "Purpose-built tools for modern healthcare professionals.",
    type: "website",
  },
  // PWA
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SkoraCare",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png" }, { url: "/icons/icon-512.png" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  other: {
    "theme-color": "#0a6e8a",
  },
};

export const viewport: Viewport = {
  // Native-app feel: no pinch-zoom or pan, covers the whole screen on
  // notched devices, and fits the iOS safe area.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
