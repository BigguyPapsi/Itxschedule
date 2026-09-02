import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

// ---------- โฟกัสกล้องบนเว็บ (โดยเฉพาะมือถือ) ----------
// expo-camera บนเว็บเรียก getUserMedia แบบไม่ระบุ width/height เลย
// เบราว์เซอร์มือถือเลยมักให้สตรีมความละเอียดต่ำ (640x480) และไม่ได้เปิด continuous autofocus
// (โค้ดใน expo-camera ส่ง autoFocus: "continuous" เข้า converter ที่รับแค่ "on"/"auto"/"off"
//  → ได้ undefined → focusMode ไม่เคยถูก apply จริง)
// ไฟล์นี้เลยเข้าไปคุย MediaStreamTrack ตรง ๆ เพื่อขอความละเอียดสูงขึ้น + เปิดโฟกัสอัตโนมัติ
// บน native ทุกฟังก์ชันเป็น no-op เพราะกล้องจัดการโฟกัสเองอยู่แล้ว

const IS_WEB = Platform.OS === "web";

// หา track กล้องที่ expo-camera สร้างไว้ (บนเว็บมันคือ <video> ที่ผูก srcObject ไว้)
const getVideoTrack = (): MediaStreamTrack | null => {
  if (!IS_WEB || typeof document === "undefined") return null;
  for (const video of Array.from(document.querySelectorAll("video"))) {
    const stream = video.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    if (track && track.readyState === "live") return track;
  }
  return null;
};

const getCapabilities = (track: MediaStreamTrack): Record<string, any> => {
  if (typeof track.getCapabilities !== "function") return {};
  try {
    return track.getCapabilities() as Record<string, any>;
  } catch {
    return {};
  }
};

const supportsFocusMode = (caps: Record<string, any>, mode: string) =>
  Array.isArray(caps.focusMode) && caps.focusMode.includes(mode);

const applyConstraints = async (
  track: MediaStreamTrack,
  constraints: Record<string, any>
) => {
  try {
    await track.applyConstraints(constraints as MediaTrackConstraints);
    return true;
  } catch {
    // เบราว์เซอร์ที่ไม่รองรับจะ throw — ปล่อยผ่าน ให้กล้องทำงานแบบเดิม
    return false;
  }
};

export function useWebCameraFocus() {
  const tuned = useRef(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      tuned.current = false;
    };
  }, []);

  // เรียกตอน onCameraReady — track อาจยังไม่ live ทันที เลยลองซ้ำสั้น ๆ
  const tuneCamera = useCallback(async () => {
    if (!IS_WEB || tuned.current) return;

    for (let attempt = 0; attempt < 10; attempt++) {
      if (cancelled.current) return;
      const track = getVideoTrack();
      if (track) {
        tuned.current = true;
        const caps = getCapabilities(track);

        const constraints: Record<string, any> = {};

        // ความละเอียดสูงขึ้น = QR ในภาพคมขึ้น jsQR อ่านออกง่ายขึ้นมาก
        // 1280x720 คือจุดที่คมพอโดยที่ decode ยังไม่หน่วง
        if (caps.width?.max) {
          constraints.width = { ideal: Math.min(1280, caps.width.max) };
        }
        if (caps.height?.max) {
          constraints.height = { ideal: Math.min(720, caps.height.max) };
        }

        const advanced: Record<string, any>[] = [];
        if (supportsFocusMode(caps, "continuous")) {
          advanced.push({ focusMode: "continuous" });
        }
        if (advanced.length > 0) constraints.advanced = advanced;

        if (Object.keys(constraints).length > 0) {
          await applyConstraints(track, constraints);
        }
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }, []);

  // แตะหน้าจอเพื่อสั่งโฟกัสใหม่ — x/y เป็นสัดส่วน 0..1 ของกรอบภาพ
  const refocus = useCallback(async (x?: number, y?: number) => {
    if (!IS_WEB) return;
    const track = getVideoTrack();
    if (!track) return;
    const caps = getCapabilities(track);

    const point =
      x !== undefined && y !== undefined && caps.pointsOfInterest
        ? { pointsOfInterest: [{ x, y }] }
        : {};

    if (supportsFocusMode(caps, "single-shot")) {
      await applyConstraints(track, {
        advanced: [{ ...point, focusMode: "single-shot" }],
      });
      return;
    }

    // ไม่มี single-shot: สลับ manual → continuous เพื่อบังคับให้กล้องหาโฟกัสใหม่
    if (
      supportsFocusMode(caps, "manual") &&
      supportsFocusMode(caps, "continuous")
    ) {
      await applyConstraints(track, { advanced: [{ focusMode: "manual" }] });
      await applyConstraints(track, {
        advanced: [{ ...point, focusMode: "continuous" }],
      });
      return;
    }

    if (Object.keys(point).length > 0) {
      await applyConstraints(track, { advanced: [point] });
    }
  }, []);

  return { tuneCamera, refocus, isWeb: IS_WEB };
}
