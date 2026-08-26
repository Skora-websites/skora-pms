import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skoracare.app",
  appName: "SkoraCare",
  webDir: "out",
  server: {
    // Capacitor Live URL: the app loads the live site DIRECTLY inside the
    // WebView — never opens an external browser.
    // - androidScheme MUST be "http" (NOT "https"): with server.url also on
    //   https, the WebView can't tell its own scheme from the remote one, so
    //   navigation falls through to Chrome. "http" keeps it internal.
    // - allowNavigation: only this host may load in the WebView (blocks
    //   external redirects from opening the system browser).
    url: process.env.CAPACITOR_SERVER_URL || "https://pms.skorainfotech.com/login",
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
