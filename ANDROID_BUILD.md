# Building the Salon POS Android App

This project is a web app hosted on Lovable. The Android app is a thin
Capacitor wrapper that loads the live published site inside a native
Android WebView. Because of that, **all tabs and features in the Android
app stay in sync with the web version automatically** — no rebuild needed
when you change the app on Lovable.

## Why your current Android build doesn't work

If you wrapped the URL manually (for example, with a basic Android Studio
WebView project) tabs probably did nothing because the WebView was
missing settings the app needs. The most common ones:

- `setJavaScriptEnabled(true)`
- `setDomStorageEnabled(true)` ← without this, `localStorage` is broken
  and the app can't save customers, invoices, settings, or your logo
- `setAllowFileAccess(true)` for local file uploads
- A `WebViewClient` that handles in-page navigation instead of opening
  every link in the system browser

Capacitor sets all of these correctly out of the box, which is why we
recommend it.

## One-time setup (on your computer, not in Lovable)

You need:

- Node.js 20+
- Android Studio (with an Android SDK installed)
- A `JAVA_HOME` pointing at JDK 17 (Android Studio bundles one)

Then, from the project root:

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Android (creates the ./android native project)
npx cap add android

# 3. Sync the capacitor.config.ts into the Android project
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

In Android Studio, click **Run** to install on a connected device or
emulator. To produce an APK or AAB for the Play Store, use
**Build → Generate Signed Bundle / APK**.

## After you change anything in capacitor.config.ts

```bash
npx cap sync android
```

## Going fully offline (optional, advanced)

The current setup requires internet because the WebView loads
`https://salon-spot-pos.lovable.app`. If you want the app to work with
no internet, you'd need to export this Lovable project as a static site
and bundle it inside the APK. That's a bigger change — happy to walk you
through it if you want.
