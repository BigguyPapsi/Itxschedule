import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { ActivityIndicator, Ionicons, Text, View } from "../components/ui";
import { api } from "../services/api";
import type { ApiError, NotificationItem } from "../types/api";

export default function NotificationHistory() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {error && (
          <View className="mb-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        {items.length === 0 ? (
          <View className="mt-16 items-center">
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#94a3b8"
            />
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
                        {item.sentBy || "System alert"} · {item.createdAt}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
