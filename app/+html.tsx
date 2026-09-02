import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// baseUrl ถูก inline ตอน build (experiments.baseUrl ใน app.json) — ไฟล์ใน public/ ถูกวางไว้ที่รากของ dist/
// dev server เสิร์ฟ public/ ที่รากเสมอ จึงใส่ prefix เฉพาะตอน export
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : (process.env.EXPO_BASE_URL ?? "").replace(/\/$/, "");

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="description" content="ITXschedule - Schedule Management App" />
        <title>ITXschedule</title>

        {/* ไอคอนตอน "เพิ่มลงหน้าจอโฮม" บน iOS — Safari และ Chrome บน iOS อ่านเฉพาะ apple-touch-icon เท่านั้น */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${BASE_URL}/apple-touch-icon.png`}
        />
        {/* ชื่อที่แสดงใต้ไอคอนบนหน้าจอโฮม */}
        <meta name="apple-mobile-web-app-title" content="ITXschedule" />
        {/* ไอคอนสำหรับเบราว์เซอร์อื่น (Chrome/Android, แท็บ, shortcut) */}
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href={`${BASE_URL}/icon-192.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href={`${BASE_URL}/icon-512.png`}
        />

        {/* ฟอนต์ลาวจาก Google Fonts CDN — เว็บไม่ใช้ฟอนต์ที่ bundle มากับแอป */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ปิด scroll ของ body เพื่อให้ ScrollView ใน RN คุมการเลื่อนเอง */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: backgroundStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// พื้นหลังตอนโหลด ให้ตรงกับ splash screen ใน app.json
const backgroundStyle = `
body {
  background-color: #ffffff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #ffffff;
  }
}
`;
