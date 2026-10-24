import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaSetup } from "@/components/pwa/pwa-setup";
import { SplashScreen } from "@/components/pwa/splash-screen";
import { ToastProvider } from "@/components/ui/toast";
import { AgentationDev } from "@/components/dev/agentation-dev";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
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
    "theme-color": "#114232",
  },
};

export const viewport: Viewport = {
  // Covers the whole screen on notched devices and fits the iOS safe area.
  // Pinch-zoom stays enabled (no maximumScale/userScalable=no): WCAG 1.4.4
  // requires text resizability, and the medical audience skews older —
  // a locked viewport locks them out.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Nonce-based CSP (audit F-08): the proxy generates a per-request nonce and
// Next.js applies it during SSR only for DYNAMICALLY rendered pages. Static
// generation happens at build time with no request, so its bootstrap scripts
// would carry no nonce and be blocked by the nonce-locked script-src. This
// must stay in lockstep with proxy.ts's buildCsp().
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SplashScreen />
        <ToastProvider>
          {children}
          <PwaSetup />
          <AgentationDev />
        </ToastProvider>
      </body>
    </html>
  );
}
