import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  server: {
    // Capacitor Live URL approach: the app loads the live site directly.
    // Start at the LOGIN page. Both HTTPS (production) and HTTP (dev /
    // cleartext fallback) are supported — cleartext:true permits http.
    url: process.env.CAPACITOR_SERVER_URL || "https://pms.skorainfotech.com/login",
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
