import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import {
  ActivityIndicator,
  Ionicons,
  Pressable,
  router,
  SafeAreaView,
  Text,
  View,
} from "../components/ui";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import type { ApiError, BulkStaffItem } from "../types/api";
import { useWebCameraFocus } from "../utils/webCameraFocus";

const showError = (message: string) => {
  if (Platform.OS === "web") return window.alert(message);
  Alert.alert("ຜິດພາດ", message, [{ text: "ຕົກລົງ" }]);
};

// ---------- กรอบเล็ง QR ----------
// ขนาดช่องเล็งกลางจอ (อยากใหญ่ขึ้นแก้เลขเดียว)
const FRAME_SIZE = 260;

// สไตล์มุมกรอบ (ใช้ร่วมกัน 4 มุม ต่างกันแค่ตำแหน่ง+ด้านของเส้น)
const cornerStyle = {
  position: "absolute" as const,
  width: 36,
  height: 36,
  borderColor: "#ffffff",
  borderRadius: 2,
};

// ---------- แปลง/ตรวจข้อมูลจาก QR ----------
// "01/08/26" → "01/08/2026" (ปี 2 หลัก เติม 20 นำหน้า ให้ตรงกับที่ backend บันทึก)
const normalizeDate = (d: string) => {
  const parts = d.trim().split("/");
  if (parts.length === 3 && parts[2].length === 2) {
    return `${parts[0]}/${parts[1]}/20${parts[2]}`;
  }
  return d.trim();
};

// รับได้ทั้ง array จริง ["01/08/2026", ...] และ string "[01/08/26, 03/08/26]"
const toDateArray = (raw: unknown): string[] | null => {
  if (Array.isArray(raw)) {
    if (!raw.every((d) => typeof d === "string")) return null;
    return raw.map(normalizeDate);
  }
  if (typeof raw === "string") {
    const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "").trim();
    if (inner === "") return []; // "[]" = ไม่มีวัน
    return inner.split(",").map(normalizeDate);
  }
  return null;
};

// ตรวจ+แปลงข้อมูลจาก QR ให้ตรงกับที่ API ต้องการ
const parseQR = (raw: string): BulkStaffItem[] | null => {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    const result: BulkStaffItem[] = [];
    for (const item of data) {
      if (typeof item?.staffID !== "string" || typeof item?.name !== "string")
        return null;
      const date = toDateArray(item.date);
      if (date === null) return null;
      result.push({ staffID: item.staffID, name: item.name, date });
    }
    return result;
  } catch {
    return null;
  }
};

export default function ScanQR() {
  // ---------- โซน hooks: อยู่บนสุด ก่อน early return เสมอ ----------
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<BulkStaffItem[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // เว็บมือถือ: บังคับเปิด autofocus + แตะเพื่อโฟกัสใหม่ (บน native เป็น no-op)
  const { tuneCamera, refocus, isWeb } = useWebCameraFocus();
  const overlaySize = useRef<{ width: number; height: number } | null>(null);
  // ---------- จบโซน hooks ----------

  // ---------- กันคนไม่ใช่ admin ----------
  if (user?.role !== "admin") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Ionicons name="lock-closed-outline" size={48} color="#94a3b8" />
        <Text className="mt-3 font-lao text-base text-slate-500">
          ບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້
        </Text>
      </View>
    );
  }

  // ---------- สิทธิ์กล้อง ----------
  if (!permission) return <View className="flex-1 bg-slate-50" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Ionicons name="camera-outline" size={48} color="#94a3b8" />
        <Text className="mt-3 text-center font-lao text-base text-slate-600">
          ຕ້ອງການສິດໃຊ້ກ້ອງເພື່ອສະແກນ QR
        </Text>
        <Pressable
          className="mt-4 rounded-2xl px-6 py-3 active:opacity-80"
          style={{ backgroundColor: "#0772BA" }}
          onPress={requestPermission}
        >
          <Text className="font-lao text-white">ອະນຸຍາດໃຊ້ກ້ອງ</Text>
        </Pressable>
      </View>
    );
  }

  // แตะบน overlay → แปลงพิกัดเป็นสัดส่วน 0..1 ของกรอบภาพ แล้วสั่งกล้องโฟกัสจุดนั้น
  const onOverlayPress = (e: GestureResponderEvent) => {
    const size = overlaySize.current;
    if (!size?.width || !size?.height) {
      refocus();
      return;
    }
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    refocus(
      clamp(e.nativeEvent.locationX / size.width),
      clamp(e.nativeEvent.locationY / size.height)
    );
  };

  const onScanned = ({ data }: { data: string }) => {
    if (scanned) return; // กันสแกนรัวซ้ำ
    console.log("📷 QR raw data:", data);
    const parsed = parseQR(data);
    console.log("🔍 parsed:", JSON.stringify(parsed, null, 2));
    if (!parsed) {
      showError("QR ນີ້ບໍ່ແມ່ນຂໍ້ມູນຕາຕະລາງທີ່ຖືກຕ້ອງ");
      return;
    }
    setScanned(parsed);
  };

  const upload = async () => {
    if (!scanned) return;
    setIsUploading(true);
    console.log("📤 กำลังส่ง:", JSON.stringify(scanned, null, 2));
    try {
      await api.monitor.bulkUpload(scanned);
      console.log("✅ upload สำเร็จ");
      if (Platform.OS === "web") window.alert("ອັບໂຫລດສຳເລັດແລ້ວ");
      else Alert.alert("ສຳເລັດ", "ອັບໂຫລດສຳເລັດແລ້ວ", [{ text: "ຕົກລົງ" }]);
      router.back(); // กลับหน้า mDate
    } catch (e) {
      console.log("❌ upload error:", JSON.stringify(e));
      showError((e as ApiError).message ?? "ອັບໂຫລດບໍ່ສຳເລັດ");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">


      {scanned === null ? (
        /* ---------- โหมดกล้อง + กรอบเล็ง ---------- */
        // <View className="flex-1 overflow-hidden rounded-t-3xl">
        <View className="flex-1 overflow-hidden">
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={onScanned}
            onCameraReady={tuneCamera}
          />

          {/* overlay มืด + ช่องเล็งตรงกลาง (แตะเพื่อสั่งโฟกัสใหม่ — มีผลเฉพาะเว็บ) */}
          <Pressable
            className="absolute inset-0"
            onLayout={(e: LayoutChangeEvent) => {
              overlaySize.current = e.nativeEvent.layout;
            }}
            onPress={onOverlayPress}
          >
            {/* แถวบน */}
            <View className="flex-1 bg-black/60" />

            {/* แถวกลาง: มืด | ช่องใส | มืด */}
            <View className="flex-row" style={{ height: FRAME_SIZE }}>
              <View className="flex-1 bg-black/60" />
              <View style={{ width: FRAME_SIZE, height: FRAME_SIZE }}>
                {/* มุม 4 อัน */}
                <View
                  style={[
                    cornerStyle,
                    { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
                  ]}
                />
                <View
                  style={[
                    cornerStyle,
                    {
                      top: 0,
                      right: 0,
                      borderTopWidth: 4,
                      borderRightWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    cornerStyle,
                    {
                      bottom: 0,
                      left: 0,
                      borderBottomWidth: 4,
                      borderLeftWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    cornerStyle,
                    {
                      bottom: 0,
                      right: 0,
                      borderBottomWidth: 4,
                      borderRightWidth: 4,
                    },
                  ]}
                />
              </View>
              <View className="flex-1 bg-black/60" />
            </View>

            {/* แถวล่าง + ข้อความ */}
            <View className="flex-1 items-center bg-black/60 pt-6">
              <Text className="rounded-full bg-black/60 px-4 py-2 font-lao text-sm text-white">
                ເອົາ QR code ໃຫ້ຢູ່ໃນກອບ
              </Text>
              {isWeb && (
                <Text className="mt-2 rounded-full bg-black/60 px-4 py-2 font-lao text-xs text-white">
                  ແຕະໜ້າຈໍເພື່ອປັບໂຟກັດ
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      ) : (
        /* ---------- โหมดตรวจข้อมูลก่อนอัปโหลด ---------- */
        <View className="flex-1 px-5">
          <View className="rounded-xl bg-amber-50 px-4 py-3">
            <Text className="font-lao text-sm text-amber-700">
              ⚠️ ກວດສອບຂໍ້ມູນກ່ອນ — ການອັບໂຫລດຈະຂຽນທັບຕາຕະລາງເດີມ
            </Text>
          </View>

          <ScrollView className="mt-3 flex-1">
            <View className="gap-2 pb-4">
              {scanned.map((item, i) => (
                <View
                  key={`${item.staffID}-${i}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-lao-bold text-base text-slate-900">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {item.staffID || "—"}
                    </Text>
                  </View>
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    {item.date.length === 0 ? (
                      <Text className="font-lao text-xs text-slate-300">
                        ບໍ່ມີວັນເຂົ້າກະ
                      </Text>
                    ) : (
                      item.date.map((d) => (
                        <View
                          key={d}
                          className="rounded-full bg-blue-50 px-2.5 py-0.5"
                        >
                          <Text className="text-[11px] text-blue-700">{d}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View className="flex-row gap-3 pb-6 pt-2">
            <Pressable
              className="flex-1 items-center rounded-xl bg-slate-100 py-3.5 active:bg-slate-200"
              onPress={() => setScanned(null)} // สแกนใหม่
            >
              <Text className="font-lao text-base text-slate-700">
                ສະແກນໃໝ່
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl py-3.5 active:opacity-80"
              style={{ backgroundColor: "#0772BA" }}
              disabled={isUploading}
              onPress={upload}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-lao text-base text-white">
                  ຢືນຢັນອັບໂຫລດ ({scanned.length} ຄົນ)
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
