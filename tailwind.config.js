/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // เว็บ: ถ้าไฟล์ .ttf โหลดไม่ได้ ให้ตกไปใช้ "Noto Sans Lao" จาก Google Fonts CDN (app/+html.tsx)
        lao: ["NotoSansLao_400Regular", "Noto Sans Lao", "sans-serif"],
        "lao-medium": ["NotoSansLao_500Medium", "Noto Sans Lao", "sans-serif"],
        "lao-semibold": ["NotoSansLao_600SemiBold", "Noto Sans Lao", "sans-serif"],
        "lao-bold": ["NotoSansLao_700Bold", "Noto Sans Lao", "sans-serif"],
      },
    },
  },
  plugins: [],
};