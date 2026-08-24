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
import type { ApiError, NotificationItem } from "../types/api";

const showError = (message: string) => {
  if (Platform.OS === "web") return window.alert(message);
  Alert.alert("ຜິດພາດ", message, [{ text: "ຕົກລົງ" }]);
};

const showSuccess = (message: string) => {
  if (Platform.OS === "web") return window.alert(message);
  Alert.alert("ສຳເລັດ", message, [{ text: "ຕົກລົງ" }]);
};

export default function Notifications() {
  // ---------- โซน hooks ----------
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ฟอร์มส่ง (เฉพาะ admin)
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await api.notifications.history());
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

  const isAdmin = user?.role === "admin";

  const closeForm = () => {
    setShowForm(false);
    setTitle("");
    setMessage("");
  };

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      showError("ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ຂໍ້ຄວາມ");
      return;
    }
    setIsSending(true);
    try {
      await api.notifications.send({
        title: title.trim(),
        message: message.trim(),
      });
      closeForm();
      await load();
      showSuccess("ສົ່ງແຈ້ງເຕືອນສຳເລັດແລ້ວ");
    } catch (e) {
      showError((e as ApiError).message ?? "ສົ່ງບໍ່ສຳເລັດ");
    } finally {
      setIsSending(false);
    }
  };

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
        {/* ปุ่มส่ง (เฉพาะ admin) */}
        {isAdmin && (
          <Pressable
            className="mb-4 w-full flex-row items-center justify-center gap-2 rounded-xl py-4 active:opacity-80"
            style={{ backgroundColor: "#0772BA" }}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="megaphone-outline" size={20} color="#fff" />
            <Text className="font-lao text-base text-white">
              ສົ່ງແຈ້ງເຕືອນໃໝ່
            </Text>
          </Pressable>
        )}

        {error && (
          <View className="mb-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        {/* ประวัติแจ้งเตือน */}
        {items.length === 0 ? (
          <View className="mt-16 items-center">
            <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
            <Text className="mt-3 font-lao text-base text-slate-400">
              ຍັງບໍ່ມີແຈ້ງເຕືອນ
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#e0f2fe" }}
                  >
                    <Ionicons name="notifications" size={20} color="#0772BA" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-lao-bold text-base text-slate-900">
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 font-lao text-sm text-slate-600">
                      {item.message}
                    </Text>
                    <View className="mt-2 flex-row items-center gap-1.5">
                      <Ionicons
                        name="person-circle-outline"
                        size={14}
                        color="#94a3b8"
                      />
                      <Text className="font-lao text-xs text-slate-400">
                        {item.sentBy} · {item.createdAt}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ---------- Modal ฟอร์มส่ง ---------- */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white px-6 pt-6" style={{ height: "70%" }}>
            <Text className="text-center font-lao-bold text-lg text-slate-900">
              ສົ່ງແຈ້ງເຕືອນໃໝ່
            </Text>

            <KeyboardAwareScrollView
              style={{ flex: 1, marginTop: 16 }}
              keyboardShouldPersistTaps="handled"
              bottomOffset={100}
            >
              {/* หัวข้อ */}
              <Text className="mb-1 font-lao text-sm text-slate-700">
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
                onPress={closeForm}
              >
                <Text className="font-lao text-base text-slate-700">
                  ຍົກເລີກ
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl py-3 active:opacity-80"
                style={{ backgroundColor: "#0772BA" }}
                disabled={isSending}
                onPress={send}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-lao text-base text-white">ສົ່ງ</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}