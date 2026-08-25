import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  server: {
    // Dev: point at the local Next.js server for hot reload during
    // Capacitor development. Replace with the production URL when the app
    // is served remotely (pms.skorainfotech.com).
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
