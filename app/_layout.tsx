import {
  NotoSansLao_400Regular,
  NotoSansLao_500Medium,
  NotoSansLao_600SemiBold,
  NotoSansLao_700Bold,
  useFonts,
} from "@expo-google-fonts/noto-sans-lao";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  ActivityIndicator,
  SafeAreaView,
  TopNav,
  View,
} from "../components/ui";
import { AuthProvider, useAuth } from "../context/auth";
import UseNoti from "../services/Notifications";
import { useWebClickToDismiss } from "../utils/keyboard";
import "../global.css";
function RootNavigator() {
  const { token, isLoading } = useAuth();
  useWebClickToDismiss();
  UseNoti();
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0772BA" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      {token && <TopNav />}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="swap" />
          <Stack.Screen name="edit" />
          <Stack.Screen name="mDate" />
          <Stack.Screen name="mangeUsers" />
          <Stack.Screen name="swapRequests" />
          <Stack.Screen name="about" />
          <Stack.Screen name="scheduledNoti" />
          <Stack.Screen name="notiCreate" />
          <Stack.Screen name="notiHistory" />
        </Stack.Protected>

        <Stack.Protected guard={!token}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansLao_400Regular,
    NotoSansLao_500Medium,
    NotoSansLao_600SemiBold,
    NotoSansLao_700Bold,
  });

  // เว็บใช้ฟอนต์จาก CDN (app/+html.tsx) → ไม่ต้องรอ useFonts ที่ 404
  // มือถือ bundle ฟอนต์ในตัว → รอโหลดให้เสร็จก่อน
  if (!fontsLoaded && Platform.OS !== "web") {
    return null;
  }

  return (
    <KeyboardProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </AuthProvider>
    </KeyboardProvider>
  );
}

