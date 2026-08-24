import AntDesign from "@expo/vector-icons/AntDesign";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Ionicons,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "../components/ui";
import { useAuth } from "../context/auth";
import type { ApiError } from "../types/api";
import { dismissInput } from "../utils/keyboard";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      setError("ກາລຸນາປ້ອນເບີໂທ ແລະ ລະຫັດຜ່ານ");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(phone, password);
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.status === 401 || err.status === 400
          ? "ເບີໂທ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ"
          : (err.message ?? "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAwareScrollView
      
        className="flex-1"
       
      >
        <Pressable className="flex-1" onPressIn={dismissInput}>
          <View className="flex-1 justify-center p-6">
            <View className="mb-4 flex-row items-center justify-center gap-4">
              <Image
                source={require("../assets/images/itx-logo.png")}
                style={{ width: 150, height: 150 }}
                contentFit="contain"
              />
            </View>

            <Text className="text-2xl font-bold text-slate-900">
              ITXschedule
            </Text>
            <Text className="mt-1 font-lao text-base text-slate-500">
              ຍິນດີຕ້ອນຮັບ ເຂົ້າສູ່ແອັບ ITXschedule ກະລຸນາເຂົ້າສູ່ລະບົບ
            </Text>

            <View className="mt-8 gap-4">
              <View>
                <Text className="mb-1.5 text-sm font-medium text-slate-700 font-lao">
                  ເບີໂທລະສັບ
                </Text>
                <TextInput
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900"
                  placeholder="20-XXXX-XXXX"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View>
                <Text className="mb-1.5 text-sm font-medium text-slate-700 font-lao">
                  ລະຫັດຜ່ານ
                </Text>
                <TextInput
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {error && (
                <View className="rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm text-red-600 font-lao">{error}</Text>
                </View>
              )}

              <Pressable
                className={`mt-2 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                  isSubmitting
                    ? "bg-blue-400"
                    : "bg-blue-600 active:bg-blue-700"
                }`}
                disabled={isSubmitting}
                onPress={handleLogin}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <AntDesign name="login" size={15} color="#ffffff" />
                    <Text className="text-base font-semibold text-white">
                      Login
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
