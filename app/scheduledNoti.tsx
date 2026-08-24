import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator,
  Ionicons,
  Pressable,
  Text,
  View,
} from "../components/ui";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import type { ApiError, ScheduledNotification } from "../types/api";

const showError = (message: string) => {
  if (Platform.OS === "web") return window.alert(message);
  Alert.alert("ຜິດພາດ", message, [{ text: "ຕົກລົງ" }]);
};

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

// ตรวจรูปแบบเวลา HH:MM (00:00–23:59)
const isValidTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t.trim());

export default function ScheduledNotifications() {
  // ---------- โซน hooks ----------
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sheet ฟอร์ม: null = ปิด, "new" = เพิ่ม, item = แก้ไข
  const [editing, setEditing] = useState<ScheduledNotification | "new" | null>(
    null,
  );
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await api.notifications.scheduled());
    } catch (e) {
      setError((e as ApiError).message ?? "ໂຫລດຂໍ້ມູນບໍ່ສຳເລັດ");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  // ---------- จบโซน hooks ----------

  // กันคนไม่ใช่ admin
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

  const closeSheet = () => setEditing(null);

  const openCreate = () => {
    setTime("");
    setTitle("");
    setMessage("");
    setEditing("new");
  };

  const openEdit = (item: ScheduledNotification) => {
    setTime(item.time);
    setTitle(item.title);
    setMessage(item.message);
    setEditing(item);
  };

  // พิมพ์ตัวเลข → ใส่ ":" อัตโนมัติ + คุมค่าให้เป็นเวลาจริง
  const onTimeChange = (raw: string) => {
    let digits = raw.replace(/[^0-9]/g, "").slice(0, 4);

    // ชั่วโมงตัวแรกไม่เกิน 2, นาทีตัวแรกไม่เกิน 5 (กันพิมพ์ 99:99)
    if (digits.length >= 1 && Number(digits[0]) > 2) {
      digits = "2" + digits.slice(1);
    }
    if (digits.length >= 3 && Number(digits[2]) > 5) {
      digits = digits.slice(0, 2) + "5" + digits.slice(3);
    }

    if (digits.length <= 2) {
      setTime(digits);
    } else {
      setTime(`${digits.slice(0, 2)}:${digits.slice(2)}`);
    }
  };

  const save = async () => {
    if (!isValidTime(time)) {
      showError("ຮູບແບບເວລາບໍ່ຖືກຕ້ອງ (ຕົວຢ່າງ 14:30)");
      return;
    }
    if (!title.trim() || !message.trim()) {
      showError("ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ຂໍ້ຄວາມ");
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        time: time.trim(),
        title: title.trim(),
        message: message.trim(),
      };
      if (editing === "new") {
        await api.notifications.createScheduled(body);
      } else if (editing) {
        await api.notifications.updateScheduled(editing.id, {
          ...body,
          enabled: editing.enabled,
        });
      }
      closeSheet();
      await load();
    } catch (e) {
      showError((e as ApiError).message ?? "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setIsSaving(false);
    }
  };

  // เปิด/ปิดการตั้งเวลา
  const toggle = async (item: ScheduledNotification) => {
    setTogglingId(item.id);
    try {
      await api.notifications.updateScheduled(item.id, {
        time: item.time,
        title: item.title,
        message: item.message,
        enabled: !item.enabled,
      });
      await load();
    } catch (e) {
      showError((e as ApiError).message ?? "ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = (item: ScheduledNotification) =>
    confirmAction(
      "ລົບການຕັ້ງເວລາ",
      `ລົບ "${item.title}" (${item.time}) ແທ້ບໍ?`,
      async () => {
        try {
          await api.notifications.removeScheduled(item.id);
          await load();
        } catch (e) {
          showError((e as ApiError).message ?? "ລົບບໍ່ສຳເລັດ");
        }
      },
    );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0772BA" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              load();
            }}
            colors={["#0772BA"]}
          />
        }
      >
        {/* ปุ่มเพิ่ม */}
        <Pressable
          className="mb-4 w-full flex-row items-center justify-center gap-2 rounded-xl py-4 active:opacity-80"
          style={{ backgroundColor: "#0772BA" }}
          onPress={openCreate}
        >
          <Ionicons name="alarm-outline" size={20} color="#fff" />
          <Text className="font-lao text-base text-white">ຕັ້ງເວລາໃໝ່</Text>
        </Pressable>

        {error && (
          <View className="mb-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        {items.length === 0 ? (
          <View className="mt-16 items-center">
            <Ionicons name="alarm-outline" size={48} color="#94a3b8" />
            <Text className="mt-3 font-lao text-base text-slate-400">
              ຍັງບໍ່ມີການຕັ້ງເວລາ
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
                style={{ opacity: item.enabled ? 1 : 0.55 }}
              >
                <View className="flex-row items-center">
                  {/* เวลา */}
                  <View
                    className="items-center justify-center rounded-xl px-3 py-2"
                    style={{ backgroundColor: "#e0f2fe" }}
                  >
                    <Text
                      className="text-lg font-bold"
                      style={{ color: "#0772BA" }}
                    >
                      {item.time}
                    </Text>
                  </View>

                  {/* หัวข้อ + ข้อความ */}
                  <View className="ml-3 flex-1">
                    <Text
                      className="font-lao-bold text-base text-slate-900"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="font-lao text-sm text-slate-500"
                      numberOfLines={1}
                    >
                      {item.message}
                    </Text>
                  </View>

                  {/* สวิตช์เปิด/ปิด (custom — คุมสีเองทุก platform) */}
                  {togglingId === item.id ? (
                    <ActivityIndicator color="#0772BA" />
                  ) : (
                    <Pressable
                      onPress={() => toggle(item)}
                      style={{
                        width: 48,
                        height: 28,
                        borderRadius: 14,
                        padding: 3,
                        justifyContent: "center",
                        backgroundColor: item.enabled ? "#22c55e" : "#cbd5e1",
                        alignItems: item.enabled ? "flex-end" : "flex-start",
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </Pressable>
                  )}
                </View>

                {/* ปุ่มแก้ไข/ลบ */}
                <View className="mt-3 flex-row gap-2 border-t border-slate-100 pt-3">
                  <Pressable
                    className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 active:bg-slate-200"
                    onPress={() => openEdit(item)}
                  >
                    <Ionicons name="pencil" size={16} color="#0f172a" />
                    <Text className="font-lao text-sm text-slate-700">
                      ແກ້ໄຂ
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 active:bg-red-100"
                    onPress={() => remove(item)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text className="font-lao text-sm text-red-500">ລົບ</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ---------- Sheet ฟอร์มเพิ่ม/แก้ไข ---------- */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="rounded-t-3xl bg-white px-6 pt-6"
            style={{ height: "75%" }}
          >
            <Text className="text-center font-lao-bold text-lg text-slate-900">
              {editing === "new" ? "ຕັ້ງເວລາໃໝ່" : "ແກ້ໄຂການຕັ້ງເວລາ"}
            </Text>

            <KeyboardAwareScrollView
              style={{ flex: 1, marginTop: 16 }}
              keyboardShouldPersistTaps="handled"
              bottomOffset={100}
            >
              {/* เวลา */}
              <Text className="mb-1 font-lao text-sm text-slate-700">
                ເວລາ (HH:MM)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900"
                value={time}
                placeholder="14:30"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={5}
                onChangeText={onTimeChange}
              />

              {/* หัวข้อ */}
              <Text className="mb-1 mt-4 font-lao text-sm text-slate-700">
                ຫົວຂໍ້
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-lao text-base text-slate-900"
                value={title}
                placeholder="ຫົວຂໍ້ແຈ້ງເຕືອນ"
                placeholderTextColor="#94a3b8"
                onChangeText={setTitle}
              />

              {/* ข้อความ */}
              <Text className="mb-1 mt-4 font-lao text-sm text-slate-700">
                ຂໍ້ຄວາມ
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-lao text-base text-slate-900"
                value={message}
                placeholder="ເນື້ອໃນຂໍ້ຄວາມ"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
                onChangeText={setMessage}
              />
            </KeyboardAwareScrollView>

            {/* ปุ่มล่าง */}
            <View
              className="-mx-6 flex-row gap-3 px-6 py-3"
              style={{ borderTopWidth: 1, borderTopColor: "#cbcbd4" }}
            >
              <Pressable
                className="flex-1 items-center rounded-xl bg-slate-100 py-3 active:bg-slate-200"
                onPress={closeSheet}
              >
                <Text className="font-lao text-base text-slate-700">
                  ຍົກເລີກ
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl py-3 active:opacity-80"
                style={{ backgroundColor: "#0772BA" }}
                disabled={isSaving}
                onPress={save}
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