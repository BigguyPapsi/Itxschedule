import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useAuth } from "../../context/auth";
import Profile from "../../components/Setting/Profile";
import {
  ActivityIndicator,
  Image,
  Ionicons,
  Link,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "../../components/ui";
import { api } from "../../services/api";
import type {
  ApiError,
  MonitoringToday,
  MonitoringTomorrow,
  ScheduleStaff,
} from "../../types/api";

const DAY_LABELS_LO: Record<string, string> = {
  monday: "ວັນຈັນ",
  tuesday: "ວັນອັງຄານ",
  wednesday: "ວັນພຸດ",
  thursday: "ວັນພະຫັດ",
  friday: "ວັນສຸກ",
  saturday: "ວັນເສົາ",
  sunday: "ວັນອາທິດ",
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

const formatHeader = (dateStr: string, day: string) => {
  const [d, m] = dateStr.split("/").map(Number);
  const dayName = DAY_LABELS_LO[day.toLowerCase()] ?? day;
  return `${dayName}, ${d} ${MONTHS_LO[m - 1] ?? ""}`;
};

const AVATAR_COLORS = [
  { bg: "#fee2e2", text: "#ef4444" },
  { bg: "#d1fae5", text: "#059669" },
  { bg: "#dbeafe", text: "#2563eb" },
  { bg: "#fef3c7", text: "#d97706" },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

function StaffCard({
  person,
  index,
  date,
  dayLabel,
}: {
  person: ScheduleStaff;
  index: number;
  date: string;
  dayLabel: string;
}) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center">
        {person.image ? (
          <Image
            source={{ uri: person.image }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
            contentFit="cover"
          />
        ) : (
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: color.bg }}
          >
            <Text
              className="font-lao-bold text-base"
              style={{ color: color.text }}
            >
              {initials(person.fullName)}
            </Text>
          </View>
        )}

        <View className="ml-3 flex-1">
          {/* chip ชื่อเล่น */}
          <View
            className="self-start rounded-full px-2 py-0.5"
            style={{ backgroundColor: color.bg }}
          >
            <Text
              className="font-lao text-[10px]"
              style={{ color: color.text }}
            >
              {person.nickName}
            </Text>
          </View>

          {/* ชื่อเต็ม */}
          <Text className="mt-0.5 font-lao-bold text-base text-slate-900">
            {person.fullName}
          </Text>

          {/* ตำแหน่ง */}
          <Text className="font-lao text-sm text-slate-500">
            {person.position}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-1.5 border-t border-slate-100 pt-2.5">
        <Ionicons name="checkmark-circle-outline" size={15} color="#0772BA" />
        <Text
          className="font-lao text-xs tracking-wide"
          style={{ color: "#0772BA" }}
        >
          {date} · {dayLabel}
        </Text>
      </View>
    </View>
  );
}

export default function Home() {
  const [today, setToday] = useState<MonitoringToday | null>(null);
  const [tomorrow, setTomorrow] = useState<MonitoringTomorrow | null>(null);
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const load = useCallback(async () => {
    try {
      setError(null);
      const [t, tm, reqs] = await Promise.all([
        api.monitoring.today(),
        api.monitoring.tomorrow(),
        api.swap.requests(),
      ]);
      setToday(t);
      setTomorrow(tm);
      setPendingCount(
        reqs.incoming.filter((r) => r.status === "pending").length +
          reqs.outgoing.filter((r) => r.status === "pending").length,
      );
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
  const current =
    tab === "today"
      ? today && { date: today.today, day: today.day, staff: today.staff }
      : tomorrow && {
          date: tomorrow.tomorrow,
          day: tomorrow.day,
          staff: tomorrow.staff,
        };

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
        <View className="flex-row justify-between px-6 pt-6">
          <View>
            {/* <Text>TTT</Text> */}
            <Image
              source={require("../../assets/images/itx-logo.png")}
              style={{
                width: 70,
                height: 40,
              }}
              contentFit="contain"
            />
          </View>
          <View className="flex-row">
       
            <View>
              <Link href="/notiHistory" asChild>
                <Pressable className="self-center active:opacity-80">
                  <View style={{ width: 100, height: 40 }}>
                    <View
                      className="flex-row h-10 w-25 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#0772BA" }}
                    >
                      <Ionicons name="notifications" size={18} color="white" />
                      <Text className="font-lao pl-1" style={{ color: "#FFF" }}>
                        ແຈ້ງເຕືອນ
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            </View>
            <View className="ml-2">
              <Link href="/swapRequests" asChild>
                <Pressable className="self-center active:opacity-80">
                  <View style={{ width: 46, height: 46 }}>
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#0772BA" }}
                    >
                      <Ionicons name="mail" size={20} color="#fff" />
                    </View>

                    {pendingCount > 0 && (
                      <View
                        className="h-6 w-6 items-center justify-center rounded-full border-2 border-white"
                        style={{
                          backgroundColor: "#ef4444",
                          position: "absolute",
                          top: -5,
                          right: -2,
                        }}
                      >
                        <Text className="text-xs font-bold text-white">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
        <View className="px-6 pt-2">
          <Profile
            img={user?.image}
            name={user?.fullName ?? ""}
            nickName={user?.nickName ?? ""}
            position={user?.position ?? ""}
            role={user?.role ?? ""}
          />
        </View>
        <View className="p-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <FontAwesome5 name="calendar-alt" size={24} color="#0772BA" />

              <Text className="font-lao-bold text-2xl text-slate-900">
                {" "}
                {current ? formatHeader(current.date, current.day) : ""}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {(["today", "tomorrow"] as const).map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={active ? { backgroundColor: "#0772BA" } : undefined}
                  onPress={() => setTab(t)}
                >
                  <Text
                    className={`font-lao text-sm ${
                      active ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {t === "today" ? "ເຂົ້າກະມື້ນີ້" : "ເຂົ້າກະມື້ອື່ນ"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error && (
            <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
              <Text className="font-lao text-sm text-red-600">{error}</Text>
            </View>
          )}
          <Text className="mt-4 font-lao text-xs text-slate-400">
            ເຂົ້າກະ · {current?.staff.length ?? 0} ຄົນ
          </Text>
          <View className="mt-3 gap-3">
            {!current || current.staff.length === 0 ? (
              <View className="items-center rounded-2xl bg-white p-8">
                <Ionicons name="calendar-outline" size={40} color="#94a3b8" />
                <Text className="mt-2 font-lao text-sm text-slate-400">
                  ບໍ່ມີຜູ້ເຂົ້າກະ
                </Text>
              </View>
            ) : (
              current.staff.map((person, i) => (
                <StaffCard
                  key={`${current.date}-${i}`}
                  person={person}
                  index={i}
                  date={current.date}
                  dayLabel={
                    DAY_LABELS_LO[current.day.toLowerCase()] ?? current.day
                  }
                />
              ))
            )}
          </View>

          <Link href="/swap" asChild>
            <Pressable
              className="mt-4 w-full flex-row items-center justify-center gap-2 rounded-xl py-4 active:opacity-80"
              style={{ backgroundColor: "#0772BA" }}
            >
              <MaterialIcons name="swap-horiz" size={24} color="white" />
              <Text className="font-lao text-base text-white">
                ສະຫຼັບວັນເຂົ້າກະ
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
