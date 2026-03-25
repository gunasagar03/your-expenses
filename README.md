# 💰 Your Expenses — AI-Powered Expense Tracker

> Smart money tracking with offline support, beautiful UI, and AI-generated insights.

---

## 📱 What's Inside

| Feature | Status |
|---|---|
| No login required | ✅ Opens instantly |
| 100% offline | ✅ Service Worker PWA |
| SQLite-equivalent local DB | ✅ localStorage |
| Smart category auto-detect | ✅ Keyword AI engine |
| Pie + Bar charts | ✅ Chart.js |
| Dynamic AI insights | ✅ Pattern analysis |
| Monthly goal tracking | ✅ With progress bar |
| Gamification (streaks, levels) | ✅ |
| Export CSV | ✅ |
| Share insights | ✅ Native share API |
| Dark + Light mode | ✅ |
| Material-style design | ✅ |
| Ad banner placeholder | ✅ AdMob-ready |

---

## 🚀 HOW TO CONVERT TO APK (3 Methods)

### ✅ METHOD 1 — PWABuilder (EASIEST, FREE)

1. **Host the files** on any free host:
   - Go to https://netlify.com → drag & drop the folder → get a URL
   - OR use https://vercel.com → import folder
   - OR use GitHub Pages

2. **Go to** https://www.pwabuilder.com

3. **Enter your URL** and click "Start"

4. Click **"Android"** → **"Generate Package"**

5. Download the `.apk` or `.aab` file

6. **Done!** Install on your phone or upload to Play Store.

---

### ✅ METHOD 2 — Capacitor (Best Quality)

```bash
# Prerequisites: Node.js, Android Studio

# 1. Install Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Init project
npx cap init "Your Expenses" "com.yourexpenses.app" --web-dir="."

# 3. Add Android platform
npx cap add android

# 4. Copy web files
npx cap copy android

# 5. Open in Android Studio
npx cap open android

# 6. In Android Studio: Build → Generate Signed Bundle/APK
```

---

### ✅ METHOD 3 — WebView APK (Simplest Code)

If you have Android Studio, create a new project and replace MainActivity with:

```java
// MainActivity.java
package com.yourexpenses.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        setContentView(webView);
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);     // enables localStorage
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
    }
}
```

Then copy all files from this project into `app/src/main/assets/`.

---

## 📂 Project Structure

```
your-expenses/
├── index.html          ← Main app shell (all screens)
├── manifest.json       ← PWA / installable app config
├── sw.js               ← Service Worker (offline cache)
├── css/
│   └── main.css        ← Full design system (dark/light)
├── js/
│   ├── db.js           ← Database layer (localStorage)
│   ├── insights.js     ← AI category detection + insights
│   ├── charts.js       ← Pie + bar chart rendering
│   └── app.js          ← Main controller (MVVM ViewModel)
└── assets/
    ├── icon-192.png    ← App icon
    └── icon-512.png    ← App icon (high res)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│         UI Layer (HTML/CSS)     │
│  Dashboard · Add · History · AI │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      ViewModel (app.js)         │
│  State management · Navigation  │
└───┬──────────┬──────────────────┘
    │          │
┌───▼───┐ ┌───▼────────┐
│ DB.js │ │ insights.js│
│ CRUD  │ │ AI Engine  │
└───────┘ └────────────┘
```

---

## 💡 Smart Category Keywords

| Category | Keywords |
|---|---|
| 🍔 Food | burger, pizza, zomato, swiggy, restaurant, grocery... |
| 🚗 Travel | uber, ola, petrol, metro, flight, irctc, bus... |
| 🛍️ Shopping | amazon, flipkart, myntra, mall, clothes, gadget... |
| 💡 Bills | electricity, jio, airtel, rent, emi, netflix... |
| 🎬 Entertainment | movie, pvr, concert, party, gaming... |

---

## 📊 AdMob Integration

Replace the ad banner div in index.html:

```html
<!-- Replace this: -->
<div id="adBanner" class="ad-banner">...</div>

<!-- With AdMob script for web, or use AdMob SDK in Capacitor/Android -->
```

For Capacitor, install:
```bash
npm install @capacitor-community/admob
```

---

## 🎨 Customization

- **Colors**: Edit CSS variables in `css/main.css` under `:root`
- **Currency**: Search & replace `₹` with your currency symbol
- **Categories**: Edit `CATEGORIES` array in `js/insights.js`
- **Keywords**: Edit `KEYWORD_MAP` in `js/insights.js`
- **Insights**: Edit `generate()` in `js/insights.js`

---

## ✅ Browser/OS Support

- Android Chrome 80+ ✅
- iOS Safari 14+ ✅  
- All modern browsers ✅
- Works offline after first load ✅

---

*Built with ❤️ — No server, no login, no tracking. Your data stays on your device.*
