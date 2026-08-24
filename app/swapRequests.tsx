import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform, RefreshControl, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import {
  ActivityIndicator,
  Ionicons,
  Pressable,
  router,
  SafeAreaView,
  Text,
  View,
} from "../components/ui";
import { api } from "../services/api";
import type { ApiError, SwapRequestItem } from "../types/api";

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

// ป้ายสถานะ
const STATUS_LABELS: Record<
  string,
  { text: string; bg: string; color: string }
> = {
  pending: { text: "ລໍຖ້າ", bg: "#fef3c7", color: "#d97706" },
  accepted: { text: "ຍອມຮັບແລ້ວ", bg: "#d1fae5", color: "#059669" },
  rejected: { text: "ປະຕິເສດ", bg: "#fee2e2", color: "#ef4444" },
  cancelled: { text: "ຍົກເລີກແລ້ວ", bg: "#e2e8f0", color: "#64748b" },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.pending;
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: s.bg }}
    >
      <Text className="font-lao text-[11px]" style={{ color: s.color }}>
        {s.text}
      </Text>
    </View>
  );
}

// การ์ดคำขอ 1 ใบ (ใช้ทั้งสอง tab ต่างกันแค่ปุ่มที่ส่งเข้ามาเป็น children)
function RequestCard({
  req,
  children,
}: {
  req: SwapRequestItem;
  children?: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-lao text-xs text-slate-400">{req.createdAt}</Text>
        <StatusChip status={req.status} />
      </View>

      {/* วันฝั่งผู้ขอ ⇄ วันฝั่งผู้ถูกขอ */}
      <View className="mt-3 flex-row items-center justify-center gap-3">
        <View className="flex-1 items-center rounded-xl bg-slate-50 py-3">
          <Text className="font-lao text-xs text-slate-500">
            {req.from.nickName}
          </Text>
          <Text className="font-lao-bold text-base text-slate-900">
            {req.from.date}
          </Text>
        </View>
        <Ionicons name="swap-horizontal" size={20} color="#0772BA" />
        <View className="flex-1 items-center rounded-xl bg-slate-50 py-3">
          <Text className="font-lao text-xs text-slate-500">
            {req.to.nickName}
          </Text>
          <Text className="font-lao-bold text-base text-slate-900">
            {req.to.date}
          </Text>
        </View>
      </View>

      {children}
    </View>
  );
}

export default function SwapRequests() {
  // ---------- โซน hooks: อยู่บนสุด ก่อน early return เสมอ ----------
  const [incoming, setIncoming] = useState<SwapRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequestItem[]>([]);
  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null); // id ที่กำลังยิง action

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.swap.requests();
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
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

  // ยิง action (accept/reject/cancel) พร้อมกันกดซ้ำ + โหลดใหม่
  const doAction = async (id: number, fn: () => Promise<unknown>) => {
    setActingId(id);
    try {
      await fn();
      await load();
    } catch (e) {
      showError((e as ApiError).message ?? "ດຳເນີນການບໍ່ສຳເລັດ");
    } finally {
      setActingId(null);
    }
  };

  const accept = (req: SwapRequestItem) =>
    confirmAction(
      "ຍອມຮັບຄຳຂໍ",
      `ສະຫຼັບກະກັບ ${req.from.nickName}: ${req.to.date} ⇄ ${req.from.date} ແທ້ບໍ?`,
      () => doAction(req.id, () => api.swap.accept(req.id)),
    );

  const reject = (req: SwapRequestItem) =>
    confirmAction(
      "ປະຕິເສດຄຳຂໍ",
      `ປະຕິເສດຄຳຂໍຈາກ ${req.from.nickName} ແທ້ບໍ?`,
      () => doAction(req.id, () => api.swap.reject(req.id)),
    );

  const cancel = (req: SwapRequestItem) =>
    confirmAction("ຍົກເລີກຄຳຂໍ", "ຍົກເລີກຄຳຂໍນີ້ແທ້ບໍ?", () =>
      doAction(req.id, () => api.swap.cancel(req.id)),
    );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0772BA" />
      </View>
    );
  }

  // จำนวน pending ไว้โชว์บน tab
  const outgoingPending = outgoing.filter((r) => r.status === "pending").length;
  const incomingPending = incoming.filter((r) => r.status === "pending").length;

  // รายการของ tab ที่เลือกอยู่
  const list = tab === "outgoing" ? outgoing : incoming;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerClassName="p-5"
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




        {/* ---------- Tab: ส่งไป / ส่งมา ---------- */}
        <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-slate-100 p-1">
          {(
            [
              ["outgoing", "ຄຳຂໍທີ່ສົ່ງໄປ", outgoingPending],
              ["incoming", "ຄຳຂໍທີ່ສົ່ງມາ", incomingPending],
            ] as const
          ).map(([key, label, count]) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
                style={active ? { backgroundColor: "#0772BA" } : undefined}
                onPress={() => setTab(key)}
              >
                <Text
                  className={`font-lao text-sm ${
                    active ? "text-white" : "text-slate-500"
                  }`}
                >
                  {label}
                </Text>
                {count > 0 && (
                  <View
                    className="min-w-5 items-center rounded-full px-1.5 py-0.5"
                    style={{
                      backgroundColor: active ? "#ffffff" : "#ef4444",
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: active ? "#0772BA" : "#ffffff" }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {error && (
          <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        {/* ---------- รายการของ tab ที่เลือก ---------- */}
        <View className="mt-4 gap-3">
          {list.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8">
              <Ionicons
                name={
                  tab === "outgoing"
                    ? "paper-plane-outline"
                    : "mail-open-outline"
                }
                size={40}
                color="#94a3b8"
              />
              <Text className="mt-2 font-lao text-sm text-slate-400">
                {tab === "outgoing" ? "ບໍ່ມີຄຳຂໍທີ່ສົ່ງໄປ" : "ບໍ່ມີຄຳຂໍເຂົ້າມາ"}
              </Text>
            </View>
          ) : tab === "outgoing" ? (
            /* ---- คำขอที่เราส่งไป: ยกเลิกได้ ---- */
            outgoing.map((req) => (
              <RequestCard key={req.id} req={req}>
                {req.status === "pending" && (
                  <Pressable
                    className="mt-3 flex-row justify-center items-center rounded-xl border border-red-200 py-2.5 active:bg-red-50"
                    disabled={actingId === req.id}
                    onPress={() => cancel(req)}
                  >
                    <MaterialCommunityIcons
                      name="cancel"
                      size={15}
                      color="#F06465"
                    />
                    {actingId === req.id ? (
                      <ActivityIndicator color="#ef4444" size="small" />
                    ) : (
                      <Text className="font-lao text-sm text-red-500 pl-1">
                        ຍົກເລີກຄຳຂໍ
                      </Text>
                    )}
                  </Pressable>
                )}
              </RequestCard>
            ))
          ) : (
            /* ---- คำขอที่เขาส่งมา: ยอมรับ/ปฏิเสธ ---- */
            incoming.map((req) => (
              <RequestCard key={req.id} req={req}>
                {req.status === "pending" && (
                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      className="flex-1 flex-row justify-center items-center rounded-xl bg-slate-100 py-2.5 active:bg-red-100"
                      disabled={actingId === req.id}
                      onPress={() => reject(req)}
                    >
                      <MaterialCommunityIcons
                        name="cancel"
                        size={15}
                        color="#F06465"
                      />
                      <Text className="font-lao text-sm text-red-500 pl-1">
                        ປະຕິເສດ
                      </Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 flex-row justify-center items-center rounded-xl py-2.5 active:opacity-80"
                      style={{ backgroundColor: "#0772BA" }}
                      disabled={actingId === req.id}
                      onPress={() => accept(req)}
                    >
                      <Feather name="check-circle" size={15} color="white" />
                      {actingId === req.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="font-lao text-sm text-white pl-1">
                          ຍອມຮັບ
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </RequestCard>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
