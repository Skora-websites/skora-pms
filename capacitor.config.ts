import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  server: {
    // Fully-live: load the production app directly (no offline mode).
    url: process.env.CAPACITOR_SERVER_URL || "https://pms.skorainfotech.com",
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f1b33",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
