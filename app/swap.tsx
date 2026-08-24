import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, RefreshControl, ScrollView } from "react-native";
import {
  ActivityIndicator,
  Ionicons,
  Pressable,
  router,
  Text,
  View,
} from "../components/ui";
import { api } from "../services/api";
import type { ApiError, SwapOther } from "../types/api";

const showError = (message: string) => {
  if (Platform.OS === "web") {
    window.alert(message);
    return;
  }
  Alert.alert("ຜິດພາດ", message, [{ text: "ຕົກລົງ" }]);
};

const showSuccess = (message: string) => {
  if (Platform.OS === "web") {
    window.alert(message);
    return;
  }
  Alert.alert("ສຳເລັດ", message, [{ text: "ຕົກລົງ" }]);
};

// ---------- เช็ควันที่ผ่านมาแล้ว ----------
const parseDate = (dateStr: string) => {
  const [d, m, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
};

const todayMidnight = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

// วันก่อนวันนี้ = ผ่านมาแล้ว (วันนี้ยังสลับได้)
const isPassed = (dateStr: string) =>
  parseDate(dateStr).getTime() < todayMidnight().getTime();

export default function Swap() {
  const [myDates, setMyDates] = useState<string[]>([]);
  const [others, setOthers] = useState<SwapOther[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myDate, setMyDate] = useState<string | null>(null);
  const [target, setTarget] = useState<SwapOther | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [mine, other] = await Promise.all([
        api.swap.mine(),
        api.swap.others(),
      ]);
      // ขั้น 1 (วันของเรา): ซ่อนวันที่ผ่านมาแล้ว
      setMyDates(mine.map((m) => m.date).filter((d) => !isPassed(d)));
      // ขั้น 2 (คนอื่น): เก็บไว้ครบ ไปจัดการจาง/กดไม่ได้ตอน render
      setOthers(other);
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

  const othersByDate = useMemo(() => {
    const groups: Record<string, SwapOther[]> = {};
    for (const o of others) {
      (groups[o.date] ??= []).push(o);
    }
    return groups;
  }, [others]);
  const myDateSet = useMemo(() => new Set(myDates), [myDates]);
  const userDateSet = useMemo(() => {
    const s = new Set<string>();
    for (const o of others) {
      s.add(`${o.userID}|${o.date}`);
    }
    return s;
  }, [others]);

  const swapBlockReason = (p: SwapOther): string | null => {
    // วันที่ผ่านมาแล้ว — เช็คก่อนเสมอ (จางแม้ยังไม่เลือกขั้น 1)
    if (isPassed(p.date)) return "ວັນນີ້ຜ່ານມາແລ້ວ";
    if (!myDate) return null; // ยังไม่เลือกขั้น 1 — จางทั้งชุดด้วย opacity อยู่แล้ว
    if (p.date === myDate) return "ກະດຽວກັນກັບວັນຂອງທ່ານ";
    if (myDateSet.has(p.date)) return "ທ່ານມີກະວັນນີ້ຢູ່ແລ້ວ";
    if (userDateSet.has(`${p.userID}|${myDate}`))
      return "ລາວມີກະວັນຂອງທ່ານຢູ່ແລ້ວ";
    return null;
  };

  const submit = async () => {
    if (!myDate || !target) return;
    setIsSubmitting(true);
    try {
      await api.swap.request({
        myDate,
        targetUserID: target.userID,
        targetDate: target.date,
      });
      setMyDate(null);
      setTarget(null);
      await load();
      showSuccess("ສົ່ງຄຳຂໍໄປແລ້ວ, ລໍຖ້າການອະນຸມັດ");
    } catch (e) {
      showError((e as ApiError).message ?? "ສະຫຼັບກະບໍ່ສຳເລັດ");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 160,
        }}
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
        {error && (
          <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        {/* ---------- ขั้นที่ 1: เลือกวันของฉัน ---------- */}
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-600">
            <Text className="text-xs font-bold text-white">1</Text>
          </View>
          <Text className="font-lao-bold text-base text-slate-900">
            ເລືອກວັນຂອງທ່ານທີ່ຈະເອົາໄປແລກ
          </Text>
        </View>

        {myDates.length === 0 ? (
          <Text className="mt-3 font-lao text-sm text-slate-400">
            ທ່ານຍັງບໍ່ມີວັນເຂົ້າກະທີ່ຈະສະຫຼັບໄດ້
          </Text>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {myDates.map((d) => {
              const active = myDate === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    setMyDate(active ? null : d);
                    setTarget(null);
                  }}
                  className={`rounded-xl border px-4 py-2.5 ${
                    active
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View className="mt-6 flex-row items-center gap-2">
          <View
            className={`h-6 w-6 items-center justify-center rounded-full ${
              myDate ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <Text className="text-xs font-bold text-white">2</Text>
          </View>
          <Text className="font-lao-bold text-base text-slate-900">
            ເລືອກກະທີ່ຈະສະຫຼັບນຳ
          </Text>
        </View>

        {Object.keys(othersByDate).length === 0 ? (
          <Text className="mt-3 font-lao text-sm text-slate-400">
            ບໍ່ມີກະໃຫ້ສະຫຼັບ
          </Text>
        ) : (
          <View className="mt-3 gap-4" style={{ opacity: myDate ? 1 : 0.4 }}>
            {Object.entries(othersByDate).map(([date, people]) => (
              <View
                key={date}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <View className="bg-slate-100 px-4 py-2">
                  <Text className="font-lao-bold text-sm text-slate-700">
                    {date}
                  </Text>
                </View>
                <View className="p-2">
                  {people.map((p) => {
                    const active =
                      target?.userID === p.userID && target?.date === p.date;
                    const blockReason = swapBlockReason(p);
                    const blocked = blockReason !== null && !active;
                    return (
                      <Pressable
                        key={`${p.date}-${p.userID}`}
                        disabled={blocked}
                        onPress={() => setTarget(active ? null : p)}
                        className={`flex-row items-center rounded-xl p-3 ${
                          active
                            ? "bg-blue-600"
                            : blocked
                              ? "opacity-40"
                              : "active:bg-slate-50"
                        }`}
                      >
                        <View
                          className={`h-10 w-10 items-center justify-center rounded-full ${
                            active ? "bg-blue-500" : "bg-slate-100"
                          }`}
                        >
                          <Ionicons
                            name="person"
                            size={18}
                            color={active ? "#fff" : "#64748b"}
                          />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text
                            className={`font-lao-bold text-base ${
                              active ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {p.nickName}{" "}
                            <Text
                              className={`font-lao text-sm font-normal ${
                                active ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              ({p.fullName})
                            </Text>
                          </Text>
                          <Text
                            className={`text-sm ${
                              active ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {p.position}
                          </Text>
                          {blocked && (
                            <Text className="font-lao text-xs text-red-400">
                              {blockReason}
                            </Text>
                          )}
                        </View>
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#fff"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ---------- แถบสรุป + ปุ่มยืนยัน (โผล่เมื่อเลือกครบ) ---------- */}
      {myDate && target && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t bg-white p-6 py-4"
          style={{ borderTopColor: "#e2e8f0" }}
        >
          <View className="flex-row items-center justify-center gap-3">
            <View className="items-center">
              <Text className="font-lao text-xs text-slate-500">
                ວັນຂອງທ່ານ
              </Text>
              <Text className="text-base font-semibold text-slate-900">
                {myDate}
              </Text>
            </View>
            <Ionicons name="swap-horizontal" size={22} color="#2563eb" />
            <View className="items-center">
              <Text className="font-lao text-xs text-slate-500">
                {target.nickName}
              </Text>
              <Text className="text-base font-semibold text-slate-900">
                {target.date}
              </Text>
            </View>
          </View>
          <Pressable
            className="mt-3 items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700"
            disabled={isSubmitting}
            onPress={submit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-lao text-base text-white">
                ຢືນຢັນສະຫຼັບກະ
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}