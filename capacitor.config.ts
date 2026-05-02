import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wraps the Lovable web app into a native Android shell.
// The `server.url` points at the live Lovable site, so the Android app
// always shows the latest version of the salon POS without rebuilding.
//
// To build a fully offline APK instead, remove `server.url` and run a
// static export of the site into ./dist, then `npx cap sync android`.
const config: CapacitorConfig = {
  appId: "app.lovable.salonpos",
  appName: "Salon POS",
  webDir: "dist",
  server: {
    url: "https://salon-spot-pos.lovable.app",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "*.lovable.app",
      "*.lovableproject.com",
      "wa.me",
      "api.whatsapp.com",
    ],
  },
  android: {
    backgroundColor: "#f5ecd9",
    allowMixedContent: false,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
