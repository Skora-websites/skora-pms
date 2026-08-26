import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  server: {
    // No server.url — the app ships a local launcher (out/index.html) that
    // immediately JS-redirects to the live site. This is the proven fix for
    // BOTH the black screen (splash hides on the local page reliably) and the
    // Chrome redirect (androidScheme "http" + allowNavigation keep all
    // navigation inside the WebView).
    androidScheme: "http",
    allowNavigation: ["pms.skorainfotech.com", "*.skorainfotech.com"],
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
