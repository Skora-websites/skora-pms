import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  // Capacitor requires the directory to exist, but with server.url set nothing
  // is served from it — the app loads the deployed PWA.
  webDir: "www",
  server: {
    androidScheme: "https",
    // Must be an https URL in production.
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default config;
