import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";
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
