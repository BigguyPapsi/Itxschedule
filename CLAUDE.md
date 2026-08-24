# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ITXschedule — an Expo / React Native (New Architecture) app for IT staff duty-shift scheduling ("ເວນ"/monitoring days). Runs on iOS, Android, and web. All UI copy is **Lao**; source comments are written in **Thai**. Keep both conventions when editing.

The backend is a separate service (not in this folder); the app talks to it over REST via `EXPO_PUBLIC_BASE_URL` in `.env`.

## Commands

```bash
npm install          # .npmrc sets legacy-peer-deps=true — required, don't drop it
npm start            # expo start (dev client / QR)
npm run android      # expo start --android
npm run ios          # expo start --ios
npm run web          # expo start --web  (http://localhost:8081)
npm run lint         # expo lint (eslint flat config, eslint-config-expo)
npx tsc --noEmit     # typecheck (strict: true)
```

There is **no test suite and no test runner configured** — don't invent `npm test`.

Web production build: `npx expo export --platform web` → output in `dist/`. There is no `--production` flag on `expo start`; `expo export` is the build command. `web.output` is `"static"`, so it prerenders one `.html` per route — deploy `dist/` to a plain static host with **no** SPA catch-all rewrite (see [WEB.md](WEB.md)).

Native builds go through EAS ([eas.json](eas.json)): `development` (dev client, internal), `preview` (internal), `production` (auto-increment). `/ios` and `/android` are gitignored — this is a managed/prebuild workflow, so native config changes belong in [app.json](app.json) plugins, not in native folders.

## Architecture

**Routing** — expo-router file-based, `typedRoutes` enabled. [app/_layout.tsx](app/_layout.tsx) is the single auth gate: it wraps everything in `KeyboardProvider` → `AuthProvider`, then uses `<Stack.Protected guard={!!token}>` for app screens and `guard={!token}` for `login`. Adding a new authenticated screen means adding a `<Stack.Screen>` inside the protected block **and** an entry in `NAV_CONFIG` in [components/TopNav.tsx](components/TopNav.tsx) — TopNav renders nothing for a pathname it doesn't know, so a missing entry silently removes the header and back button.

**Auth** — [context/auth.tsx](context/auth.tsx). Only the JWT is persisted (AsyncStorage key `auth_token`); the `User` object is always fetched fresh from `/api/profile/me` on launch. A failing profile fetch clears the token and drops the user back to login. The token is pushed into the api module via `setAuthToken()`, which holds it in a module-level variable — `services/api.ts` has no dependency on React state.

**API layer** — [services/api.ts](services/api.ts) is the only place that calls `fetch`. Screens never build URLs. Two helpers: `apiFetch` (JSON) and `apiUpload` (multipart — deliberately does **not** set `Content-Type` so the boundary is generated). Non-2xx responses throw an `ApiError` (`{status, message}`), with backend English messages mapped to Lao through `ERROR_TRANSLATIONS`. Add new endpoints to the `api` object grouped by domain (`auth`, `profile`, `schedule`, `monitor`, `users`, `monitoring`, `swap`) and add matching types to [types/api.ts](types/api.ts).

**Roles** — two roles, `"admin"` and `"user"`, from `user.role`. Enforced in two independent places: [components/Setting/MenuList.tsx](components/Setting/MenuList.tsx) filters menu entries by role, and each admin screen (`mangeUsers`, `mDate`, `scanQR`) re-checks `user?.role !== "admin"` after its hooks and early-returns. Keep both — the menu filter is not a security boundary.

**Dates** — the backend format is the string `"DD/MM/YYYY"`; there is no date library. Screens parse and format these strings manually and hold Lao month names in local `MONTHS_LO` arrays. QR imports may carry 2-digit years and are normalized in [app/scanQR.tsx](app/scanQR.tsx).

**Styling** — NativeWind v4 (Tailwind class names via `className`). [global.css](global.css) is imported once in the root layout; [metro.config.js](metro.config.js) wires it through `withNativeWind`. Lao text needs an explicit font class — `font-lao`, `font-lao-medium`, `font-lao-semibold`, `font-lao-bold` (Noto Sans Lao, loaded in the root layout, which returns `null` until fonts resolve). Brand blue is `#0772BA`.

**Component imports** — [components/ui.ts](components/ui.ts) is a barrel re-exporting React Native primitives, `expo-image`'s `Image`, safe-area, `@expo/vector-icons` families, and `expo-router`'s `Link`/`router`. Screens import from `../components/ui` rather than from `react-native` directly; follow that. The `@/*` tsconfig path alias maps to the project root but is used inconsistently — relative imports dominate.

## Platform differences

The web page shell is [app/+html.tsx](app/+html.tsx). Never add `public/index.html` — `public/` is served verbatim and shadows the generated shell, so the bundle `<script>` is never injected and `/` goes blank in `expo start --web` while `expo export` still looks fine. Verify web changes in **both** dev server and export.

Mobile and web share one codebase; branch with `Platform.OS`.

- **QR scanning** — camera (`expo-camera` `CameraView`) on mobile; on web the same screen falls back to a textarea for pasting the QR's JSON payload.
- **Push notifications** — OneSignal. `UseNoti()` is called unconditionally in the root layout; Metro picks [services/Notifications.web.ts](services/Notifications.web.ts) (a no-op hook) on web and [services/Notifications.ts](services/Notifications.ts) (OneSignal) on native. A `Platform.OS` check at the call site is **not** enough here: `react-native-onesignal` calls `TurboModuleRegistry.getEnforcing` at import time, so merely importing it breaks the web bundle. Any native-only package that touches TurboModules at module scope needs this `.web.ts` split rather than a runtime guard.
- **Alerts** — mobile uses `Alert.alert` with Lao button labels; web uses `window.alert`. Screens define a local `showError` helper for this.
- **Keyboard dismissal** — [utils/keyboard.ts](utils/keyboard.ts): `useWebClickToDismiss()` runs once in the root layout and blurs inputs via a DOM capture-phase listener on web; `dismissInput()` is for `onPressIn` on mobile.

## Repo caveat

The enclosing git repository is rooted at `C:\Users\advice\Desktop`, not at this project folder, so `git status` shows many unrelated sibling directories. Stage paths explicitly; never `git add -A` from the repo root.

`app/test.tsx` and `app/test1.tsx` are scratch screens, not tests.
