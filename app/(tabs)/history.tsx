import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import {
  ActivityIndicator,
  Ionicons,
  SafeAreaView,
  Text,
  View,
} from "../../components/ui";
import { api } from "../../services/api";
import type { ApiError, SwapRequestItem } from "../../types/api";

const STATUS_LABELS: Record<
  string,
  { text: string; bg: string; color: string }
> = {
  pending: { text: "ລໍຖ້າ", bg: "#fef3c7", color: "#d97706" },
  accepted: { text: "ຍອມຮັບແລ້ວ", bg: "#d1fae5", color: "#059669" },
  rejected: { text: "ປະຕິເສດ", bg: "#fee2e2", color: "#ef4444" },
  cancelled: { text: "ຍົກເລີກແລ້ວ", bg: "#e2e8f0", color: "#64748b" },
  expired: { text: "ໝົດອາຍຸ", bg: "#e2e8f0", color: "#64748b" },
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

export default function History() {
  // ---------- โซน hooks ----------
  const [items, setItems] = useState<SwapRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await api.swap.history());
    } catch (e) {
      setError((e as ApiError).message ?? "ໂຫລດປະຫວັດບໍ່ສຳເລັດ");
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
        {error && (
          <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        <View className="mt-4 gap-3">
          {items.length === 0 ? (
            <View className="mt-16 items-center">
              <Ionicons name="time-outline" size={48} color="#94a3b8" />
              <Text className="mt-3 font-lao text-base text-slate-400">
                ຍັງບໍ່ມີປະຫວັດ
              </Text>
            </View>
          ) : (
            items.map((req) => (
              <View
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                {/* หัว: เวลาตอบ + สถานะ */}
                <View className="flex-row items-center justify-between">
                  <Text className="font-lao text-xs text-slate-400">
                    {req.respondedAt ?? req.createdAt}
                  </Text>
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
                  <Ionicons
                    name="swap-horizontal"
                    size={20}
                    color={req.status === "accepted" ? "#059669" : "#94a3b8"}
                  />
                  <View className="flex-1 items-center rounded-xl bg-slate-50 py-3">
                    <Text className="font-lao text-xs text-slate-500">
                      {req.to.nickName}
                    </Text>
                    <Text className="font-lao-bold text-base text-slate-900">
                      {req.to.date}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
