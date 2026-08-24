const MAX_PER_DAY = 2;
import { useCallback, useEffect, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import {
  ActivityIndicator,
  Image,
  Ionicons,
  Pressable,
  router,
  SafeAreaView,
  Text,
  View,
} from "../components/ui";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import type { ApiError, MonitorStaff } from "../types/api";

// ---------- ฟังก์ชันวันที่ ----------
const pad = (n: number) => String(n).padStart(2, "0");

// Date → "DD/MM/YYYY"
const toDateStr = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// สร้างรายการวัน N วันข้างหน้า (รวมวันนี้) ไว้ให้เลือก
const nextDays = (count: number) => {
  const days: { str: string; day: number; month: number }[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    days.push({ str: toDateStr(d), day: d.getDate(), month: d.getMonth() + 1 });
    d.setDate(d.getDate() + 1);
  }
  return days;
};

// confirm ที่ทำงานทั้งมือถือ (Alert) และเว็บ (confirm)
const confirmAction = (title: string, message: string, onOk: () => void) => {
  if (Platform.OS === "web") {
    if (window.confirm(message)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: "ຍົກເລີກ", style: "cancel" },
    { text: "ຕົກລົງ", style: "destructive", onPress: onOk },
  ]);
};

export default function MDate() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<MonitorStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สถานะ modal แก้ไขวัน
  const [editing, setEditing] = useState<MonitorStaff | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const pickerDays = useMemo(() => nextDays(14), []);
  const dateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const staff of staffList) {
      if (staff.userID === editing?.userID) continue; // ข้ามตัวเอง
      for (const d of staff.mDate) {
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }
    return counts;
  }, [staffList, editing]);

  const isDayFull = (dateStr: string) =>
    (dateCounts[dateStr] ?? 0) >= MAX_PER_DAY;

  const load = useCallback(async () => {
    try {
      setError(null);
      setStaffList(await api.monitor.getAll());
    } catch (e) {
      setError((e as ApiError).message ?? "ໂຫລດຂໍ້ມູນບໍ່ສຳເລັດ");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  // ---------- เปิด/บันทึก modal ----------
  const openEditor = (staff: MonitorStaff) => {
    setEditing(staff);
    setSelectedDates(new Set(staff.mDate)); // เริ่มจากวันที่มีอยู่แล้ว
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  };

  const saveDates = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      const mDate = Array.from(selectedDates);
      if (editing.mDate.length === 0) {
        // ยังไม่เคยมีวัน → POST เพิ่มใหม่
        await api.monitor.addDates({ userID: editing.userID, mDate });
      } else {
        // มีอยู่แล้ว → PUT แทนที่ทั้งชุด
        await api.monitor.updateDates(editing.userID, mDate);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError((e as ApiError).message ?? "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- reset ----------
  const resetUser = (staff: MonitorStaff) =>
    confirmAction(
      "ລ້າງວັນເຂົ້າກະ",
      `ລ້າງວັນທັງໝົດຂອງ ${staff.nickName} ແທ້ບໍ?`,
      async () => {
        try {
          await api.monitor.resetUser(staff.userID);
          await load();
        } catch (e) {
          setError((e as ApiError).message ?? "ລ້າງຂໍ້ມູນບໍ່ສຳເລັດ");
        }
      },
    );

  const resetAll = () =>
    confirmAction(
      "ລ້າງທັງໝົດ",
      "ລ້າງວັນເຂົ້າກະຂອງທຸກຄົນແທ້ບໍ? ຍ້ອນກັບຄືນບໍ່ໄດ້",
      async () => {
        try {
          await api.monitor.resetAll();
          await load();
        } catch (e) {
          setError((e as ApiError).message ?? "ລ້າງຂໍ້ມູນບໍ່ສຳເລັດ");
        }
      },
    );

  // ---------- loading ----------
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerClassName="p-6"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              load();
            }}
            colors={["#2563eb"]}
          />
        }
      >


        <View className="mt-3 flex-row items-center justify-end">

          <Pressable
            className="flex-row items-center gap-1 rounded-xl bg-red-100 px-3 py-2 active:bg-red-200"
            onPress={resetAll}
          >
            <MaterialIcons name="playlist-remove" size={22} color="red" />
            <Text className="font-lao text-sm text-red-600">ລ້າງທັງໝົດ</Text>
          </Pressable>
        </View>

        {error && (
          <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        <View className="mt-4 gap-4">
          {staffList.map((staff) => (
            <View
              key={staff.userID}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              {/* แถวบน: รูป + ชื่อ + ปุ่ม */}
              <View className="flex-row items-center">
                {staff.image ? (
                  <Image
                    source={{ uri: staff.image }}
                    className="rounded-full border border-slate-200"
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      borderColor: "#64748b",
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                    <Ionicons name="person" size={22} color="#64748b" />
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="font-lao-bold text-base text-slate-900">
                    {staff.nickName}{" "}
                    <Text className="font-lao text-sm text-slate-400">
                      ({staff.fullName})
                    </Text>
                  </Text>
                  <Text className="text-sm text-slate-500">
                    {staff.position}
                  </Text>
                </View>

                <Pressable
                  className="rounded-xl bg-[#0772BA] px-3 py-2 active:bg-blue-700"
                  onPress={() => openEditor(staff)}
                >
                  <Text className="font-lao text-sm text-white">
                    <FontAwesome
                      name="calendar-plus-o"
                      size={18}
                      color="#e3f4ff"
                    />
                  </Text>
                </Pressable>
                <Pressable
                  className="ml-2 rounded-xl bg-slate-100 p-2 active:bg-red-100"
                  onPress={() => resetUser(staff)}
                >
                  <MaterialCommunityIcons
                    name="table-large-remove"
                    size={20}
                    color="red"
                  />
                </Pressable>
              </View>

              {/* วันเข้ากะเป็น chip */}
              <View className="mt-3 flex-row flex-wrap gap-2">
                {staff.mDate.length === 0 ? (
                  <Text className="font-lao text-sm text-slate-400">
                    ຍັງບໍ່ມີວັນເຂົ້າກະ
                  </Text>
                ) : (
                  staff.mDate.map((d) => (
                    <View key={d} className="rounded-full bg-blue-50 px-3 py-1">
                      <Text className="text-xs text-blue-700">{d}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ---------- Modal เลือกวัน ---------- */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-3xl bg-white p-6">
            <Text className="font-lao-bold text-lg text-slate-900">
              ເລືອກວັນເຂົ້າກະ — {editing?.nickName}
            </Text>
            <Text className="mt-1 font-lao text-sm text-slate-500">
              ແຕະເພື່ອເລືອກ/ຍົກເລີກ (14 ວັນຂ້າງໜ້າ) · ເລືອກແລ້ວ{" "}
              {selectedDates.size} ວັນ
            </Text>

            <ScrollView className="mt-4" style={{ flexGrow: 0 }}>
              <View className="flex-row flex-wrap gap-2">
                {pickerDays.map((d) => {
                  const active = selectedDates.has(d.str);
                  const full = isDayFull(d.str) && !active;
                  return (
                    <Pressable
                      key={d.str}
                      onPress={() => toggleDate(d.str)}
                      disabled={full}
                      className={`w-[30%] items-center rounded-xl border py-3 ${
                        active
                          ? "border-blue-600 bg-blue-600"
                          : full
                            ? "border-slate-200 bg-slate-100 opacity-50"
                            : "border-slate-200 bg-white"
                      }`}
                      style={{ height: 64 }}
                    >
                      <Text
                        className={`text-base font-semibold ${
                          active
                            ? "text-white"
                            : full
                              ? "text-slate-400"
                              : "text-slate-900"
                        }`}
                      >
                        {pad(d.day)}/{pad(d.month)}
                      </Text>
                      {full && (
                        <Text className="font-lao text-[10px] text-red-400">
                          ເຕັມ
                        </Text>
                      )}
                      {!full && !active && (dateCounts[d.str] ?? 0) > 0 && (
                        <Text className="text-[10px] text-slate-400">
                          {dateCounts[d.str]}/{MAX_PER_DAY}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-xl bg-slate-100 py-3 active:bg-slate-200"
                onPress={() => setEditing(null)}
              >
                <Text className="font-lao text-base text-slate-700">
                  ຍົກເລີກ
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-blue-600 py-3 active:bg-blue-700"
                disabled={isSaving}
                onPress={saveDates}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-lao text-base text-white">ບັນທຶກ</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
