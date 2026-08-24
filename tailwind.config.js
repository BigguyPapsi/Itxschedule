/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        lao: ["NotoSansLao_400Regular"],
        "lao-medium": ["NotoSansLao_500Medium"],
        "lao-semibold": ["NotoSansLao_600SemiBold"],
        "lao-bold": ["NotoSansLao_700Bold"],
      },
    },
  },
  plugins: [],
};