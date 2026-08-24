# Web Support Guide

## Running the Web Version

To run ITXschedule on the web:

```bash
npm run web
```

This will start the Expo web server. Open your browser to the URL shown in the terminal (typically `http://localhost:8081`).

## Building for Web

To create a production build:

```bash
npx expo export --platform web
```

The static files will be generated in the `dist` directory.

Note: `expo start` has no `--production` flag — `expo export` is the build command.
Because `app.json` sets `web.output: "static"`, the export prerenders **one `.html`
file per route** (`login.html`, `settings.html`, ...) alongside the JS bundle.

### HTML Shell

The web page shell (title, meta tags, background) lives in `app/+html.tsx`.

Do **not** put an `index.html` in `public/`. Files in `public/` are served verbatim
and take precedence over the HTML that expo-router generates, so a `public/index.html`
silently shadows the real shell and the bundle `<script>` is never injected — `/`
renders a blank white page while every other route still works (they have no
matching file in `public/`). This only shows up with `npx expo start --web`;
`expo export` generates its own HTML, so the build looks fine. Test both.

## Web-Specific Features

### QR Code Scanning

On **web**, the QR scanner is replaced with a text input where you can paste the JSON data from a QR code. This allows web users to:

- Manually input QR data in JSON format
- Copy and paste QR data from another source
- Preview and confirm data before upload

On **mobile**, the camera is used with a visual QR code scanning interface.

### Notifications

Push notifications (OneSignal) are **disabled on web** and only work on iOS and Android.

This is done with a platform-specific file, not a `Platform.OS` check: `services/Notifications.web.ts` is a no-op hook that Metro substitutes for `services/Notifications.ts` when bundling for web.

A runtime guard is not sufficient for native-only packages. `react-native-onesignal` calls `TurboModuleRegistry.getEnforcing` at *import* time, so `Platform.OS !== "web" && UseNoti()` still crashed the web build — the import had already been evaluated. If you add another native-only dependency and the web build fails with `Cannot read properties of undefined (reading 'getEnforcing')`, split it into a `.web.ts` file the same way.

### Camera & Media

Features requiring direct camera access only work on mobile:

- Real-time QR scanning (camera feature)
- Image picker (uses device camera/gallery)

## Browser Compatibility

The web version works on modern browsers that support:

- React Native Web
- ES2020 or newer
- CSS Grid and Flexbox

Recommended browsers:

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

## Deployment

To deploy the web version to a static hosting service:

1. Build: `npx expo export --platform web`
2. Upload the contents of the `dist` folder to your hosting service
3. Serve the directory as-is. Do **not** add a catch-all rewrite to `index.html` —
   with `web.output: "static"` every route is already its own prerendered `.html`,
   and a SPA-style rewrite would serve the index shell for `/settings` and friends.
   A plain static host that resolves `/settings` to `settings.html` is what you want.

### Example Deployment Platforms

- Vercel: `vercel deploy dist`
- Netlify: Drag and drop the `dist` folder
- GitHub Pages, Firebase Hosting, AWS S3, etc.

## Platform Checks in Code

When writing new features, use `Platform.OS` to handle platform differences:

```tsx
import { Platform } from "react-native";

if (Platform.OS === "web") {
  // Web-specific code
} else {
  // Mobile-specific code (iOS/Android)
}
```

## Known Limitations

- Camera features require mobile device
- Haptic feedback not available on web
- File access patterns may differ between platforms
- Some native features (geolocation, etc.) require proper HTTPS and user permissions on web

## Environment Variables

The web build will use the same API endpoints and configuration as mobile. Ensure your `.env` or environment configuration is properly set up.

## Troubleshooting

### Metro bundler issues

```bash
npx expo start --web --reset
```

### Clear cache

```bash
npx expo export:web --clear
```

### Port already in use

```bash
npx expo start --web --port 8082
```
