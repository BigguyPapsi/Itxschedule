import Constants from "expo-constants";
import { ScrollView } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Image,
  Text,
  View,
} from "../components/ui";

const FEATURES = [
  {
    icon: "calendar-check",
    title: "Duty Tracking",
    desc: "See who's on duty today, tomorrow, and across the whole month at a glance.",
  },
  {
    icon: "swap-horizontal",
    title: "Shift Swapping",
    desc: "Request to swap duty days with colleagues. Both sides confirm before any change takes effect.",
  },
  {
    icon: "email-check-outline",
    title: "Request Management",
    desc: "Track requests you've sent and received, with a full history of every completed swap.",
  },
  {
    icon: "account-cog-outline",
    title: "User Management",
    desc: "Admins manage staff, roles, and duty days — plus bulk scheduling via QR code import.",
  },
] as const;

export default function About() {
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* โลโก้ + ชื่อแอป */}
        <View className="items-center pt-4">
          <View
          >
              <Image
                source={require("../assets/images/icon.png")}
                style={{ width: 78, height: 78, borderRadius:15, borderColor:"#0772BA", borderWidth:2}}
                contentFit="contain"
              />
          </View>
          <Text className="mt-3 font-lao-bold text-2xl text-slate-900">
            ITXschedule
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            Version {version}
          </Text>
        </View>

        <Text className="mt-6 text-center text-base leading-6 text-slate-600">
          A duty-tracking app that helps teams manage on-call and shift
          schedules with ease — keeping everyone informed about who&apos;s on duty,
          all in one place.
        </Text>

        <View className="mt-6 gap-3">
          {FEATURES.map((f) => (
            <View
              key={f.title}
              className="flex-row items-start rounded-2xl border border-slate-200 bg-white p-4"
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#e0f2fe" }}
              >
                <MaterialCommunityIcons
                  name={f.icon}
                  size={22}
                  color="#0772BA"
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-slate-900">
                  {f.title}
                </Text>
                <Text className="mt-0.5 text-sm leading-5 text-slate-500">
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ท้ายหน้า */}
        <View className="mt-8 items-center">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="lock-closed" size={14} color="#94a3b8" />
            <Text className="text-xs text-slate-400">
              Role-based access · Lao interface
            </Text>
          </View>
          <Text className="mt-3 text-xs text-slate-400">
            © 2026 ITXschedule
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}