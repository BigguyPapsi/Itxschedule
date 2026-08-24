import { useEffect } from "react";
import { Keyboard, Platform } from "react-native";

// ใช้กับ onPressIn บนมือถือ (เว็บไม่ต้องพึ่งตัวนี้แล้ว)
export const dismissInput = () => {
  if (Platform.OS === "web") {
    (document.activeElement as HTMLElement | null)?.blur?.();
  } else {
    Keyboard.dismiss();
  }
};

// เรียกครั้งเดียวใน RootLayout — บนเว็บ: คลิกที่ไหนก็ตามที่ไม่ใช่ช่องกรอก
// จะ blur ช่องที่กำลังพิมพ์ให้อัตโนมัติ (ดักที่ DOM โดยตรง ก่อน React แทรก)
export function useWebClickToDismiss() {
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickedInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (!clickedInput) {
        const active = document.activeElement as HTMLElement | null;
        if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") {
          active.blur();
        }
      }
    };

    // true = capture phase → ทำงานก่อน preventDefault ของ React Native Web
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);
}