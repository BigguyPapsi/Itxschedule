import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import {
  ActivityIndicator,
  Ionicons,
  Pressable,
  Text,
  View,
  SafeAreaView,
} from "../../components/ui";
import { api } from "../../services/api";
import type { ApiError, ScheduleDay } from "../../types/api";

const DAY_LABELS_LO: Record<string, string> = {
  monday: "ຈັນ",
  tuesday: "ອັງຄານ",
  wednesday: "ພຸດ",
  thursday: "ພະຫັດ",
  friday: "ສຸກ",
  saturday: "ເສົາ",
  sunday: "ອາທິດ",
};

const MONTHS_LO = [
  "ມັງກອນ",
  "ກຸມພາ",
  "ມີນາ",
  "ເມສາ",
  "ພຶດສະພາ",
  "ມິຖຸນາ",
  "ກໍລະກົດ",
  "ສິງຫາ",
  "ກັນຍາ",
  "ຕຸລາ",
  "ພະຈິກ",
  "ທັນວາ",
];

const pad = (n: number) => String(n).padStart(2, "0");

const parseDate = (dateStr: string) => {
  const [d, m, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
};

const todayMidnight = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

const isToday = (dateStr: string) =>
  parseDate(dateStr).getTime() === todayMidnight().getTime();

const isTomorrow = (dateStr: string) => {
  const t = todayMidnight();
  t.setDate(t.getDate() + 1);
  return parseDate(dateStr).getTime() === t.getTime();
};

const isPassed = (dateStr: string) =>
  parseDate(dateStr).getTime() < todayMidnight().getTime();

const monthHeader = (dateStr: string) => {
  const [, m, y] = dateStr.split("/").map(Number);
  return `${MONTHS_LO[m - 1] ?? ""} ${y}`;
};

export default function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSchedule(await api.schedule.getAll());
    } catch (e) {
      setError((e as ApiError).message ?? "ໂຫລດຕາຕະລາງບໍ່ສຳເລັດ");
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

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Ionicons name="cloud-offline-outline" size={48} color="#94a3b8" />
        <Text className="mt-3 text-center font-lao text-base text-slate-500">
          {error}
        </Text>
        <Pressable
          className="mt-4 rounded-2xl px-6 py-3 active:opacity-80"
          style={{ backgroundColor: "#0772BA" }}
          onPress={() => {
            setIsLoading(true);
            load();
          }}
        >
          <Text className="font-lao text-white">ລອງໃໝ່</Text>
        </Pressable>
      </View>
    );
  }

  const groups: { month: string; days: ScheduleDay[] }[] = [];
  for (const day of schedule) {
    const m = monthHeader(day.date);
    const last = groups[groups.length - 1];
    if (last && last.month === m) last.days.push(day);
    else groups.push({ month: m, days: [day] });
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
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

        <View className="flex-row border-b border-slate-200 px-5 py-2">
          <Text className="w-24 font-lao text-xs text-slate-400">ວັນທີ</Text>
          <Text className="flex-1 font-lao text-xs text-slate-400">
            ພະນັກງານ 1
          </Text>
          <Text className="flex-1 font-lao text-xs text-slate-400">
            ພະນັກງານ 2
          </Text>
        </View>

        {schedule.length === 0 ? (
          <View className="mt-16 items-center">
            <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
            <Text className="mt-3 font-lao text-base text-slate-500">
              ຍັງບໍ່ມີຕາຕະລາງ
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.month}>
              <View className="bg-slate-100 px-5 py-2">
                <Text className="font-lao text-xs text-slate-500">
                  {group.month}
                </Text>
              </View>

              {group.days.map((day) => {
                const passed = isPassed(day.date);
                const today = isToday(day.date);
                const tomorrow = isTomorrow(day.date);
                const [dNum, mNum] = day.date.split("/");
                const dayLao = DAY_LABELS_LO[day.day.toLowerCase()] ?? day.day;

                return (
                  <View
                    key={day.date}
                    className={`flex-row border-b border-slate-100 px-5 py-3 ${
                      passed ? "opacity-40" : ""
                    } ${today ? "border-l-4" : ""}`}
                    style={
                      today
                        ? {
                            backgroundColor: "#eff6ff",
                            borderLeftColor: "#0772BA",
                          }
                        : undefined
                    }
                  >
                    {/* คอลัมน์วันที่ */}
                    <View className="w-24">
                      <Text
                        className={`text-base ${
                          today
                            ? "font-lao-bold text-slate-900"
                            : "font-lao text-slate-700"
                        }`}
                      >
                        {dNum}/{mNum}
                      </Text>
                      <Text className="font-lao text-xs text-slate-400">
                        {dayLao}
                        {today ? " · ມື້ນີ້" : tomorrow ? " · ມື້ອື່ນ" : ""}
                      </Text>
                    </View>

                    {[0, 1].map((slot) => {
                      const person = day.staff[slot];
                      return (
                        <View key={slot} className="flex-1 pr-2">
                          {person ? (
                            <>
                              <Text
                                className={`text-sm ${
                                  today
                                    ? "font-lao-bold text-slate-900"
                                    : "font-lao text-slate-800"
                                }`}
                                numberOfLines={1}
                              >
                                {person.fullName}
                              </Text>
                              <Text
                                className="font-lao text-xs"
                                style={{ color: "#0772BA" }}
                                numberOfLines={1}
                              >
                                {person.nickName}
                              </Text>
                              <Text
                                className="font-lao text-xs text-slate-400"
                                numberOfLines={1}
                              >
                                {person.position}
                              </Text>
                            </>
                          ) : (
                            <Text className="font-lao text-xs text-slate-300">
                              —
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
