import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  server: {
    // Production: the APK loads the live app at pms.skorainfotech.com.
    // For local dev, set CAPACITOR_SERVER_URL=http://localhost:3000
    url: process.env.CAPACITOR_SERVER_URL || "https://pms.skorainfotech.com",
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
