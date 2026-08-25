import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  // NOTE: intentionally NO server.url — the app ships a local launcher
  // (out/index.html) that immediately redirects to the live site via JS.
  // This avoids the Capacitor remote-URL blank-screen issue: the splash
  // hides on the local page (reliable), then navigates to the server.
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
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
