import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator,
  Image,
  Ionicons,
  Pressable,
  router,
  Text,
  View,
} from "../components/ui";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import type { ApiError } from "../types/api";

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

const showError = (message: string) => {
  if (Platform.OS === "web") return window.alert(message);
  Alert.alert("ຜິດພາດ", message, [{ text: "ຕົກລົງ" }]);
};

const showSuccess = (message: string) => {
  if (Platform.OS === "web") return window.alert(message);
  Alert.alert("ສຳເລັດ", message, [{ text: "ຕົກລົງ" }]);
};

// ---------- แนบรูปเข้า FormData: มือถือ vs เว็บ ต่างวิธีกัน ----------
const appendImage = async (
  fd: FormData,
  asset: ImagePicker.ImagePickerAsset,
) => {
  const name = asset.fileName ?? `avatar-${Date.now()}.jpg`;
  const type = asset.mimeType ?? "image/jpeg";

  if (Platform.OS === "web") {
    // เว็บ: uri เป็น blob:/data: URL — ต้อง fetch แปลงเป็น Blob จริงก่อน
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    fd.append("image", blob, name);
  } else {
    // มือถือ: ส่งเป็น object { uri, name, type }
    fd.append("image", {
      uri: asset.uri,
      name,
      type,
    } as unknown as Blob);
  }
};

export default function Edit() {
  const { user, logout, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    phone: user?.phone ?? "",
    password: "",
    fullName: user?.fullName ?? "",
    nickName: user?.nickName ?? "",
    position: user?.position ?? "",
  });
  const [pickedImage, setPickedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPickedImage(result.assets[0]);
  };

  const save = async () => {
    if (!form.phone || !form.fullName) {
      showError("ກະລຸນາປ້ອນເບີໂທ ແລະ ຊື່ເຕັມ");
      return;
    }
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("phone", form.phone);
      if (form.password) fd.append("password", form.password);
      fd.append("fullName", form.fullName);
      fd.append("nickName", form.nickName);
      fd.append("position", form.position);
      if (pickedImage) {
        await appendImage(fd, pickedImage); // ← switch มือถือ/เว็บ
      }

      await api.profile.update(fd);
      await refreshProfile();
      showSuccess("ບັນທຶກສຳເລັດແລ້ວ");
      router.back();
    } catch (e) {
      showError((e as ApiError).message ?? "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = () =>
    confirmAction(
      "ລົບບັນຊີ",
      "ລົບບັນຊີຂອງທ່ານຖາວອນແທ້ບໍ? ຍ້ອນກັບຄືນບໍ່ໄດ້",
      async () => {
        try {
          await api.profile.remove();
        } catch (e) {
          showError((e as ApiError).message ?? "ລົບບັນຊີບໍ່ສຳເລັດ");
        } finally {
          await logout();
        }
      },
    );

  const currentImage = pickedImage?.uri ?? user?.image ?? null;

  return (
    <View className="flex-1 bg-slate-50">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
      >
        {/* รูปโปรไฟล์ */}
        <Pressable className="mt-2 items-center" onPress={pickImage}>
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
              contentFit="cover"
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-slate-200">
              <Ionicons name="camera" size={32} color="#64748b" />
            </View>
          )}
          <Text className="mt-1 font-lao text-xs text-blue-600">
            ແຕະເພື່ອປ່ຽນຮູບ
          </Text>
        </Pressable>

        {/* ช่องกรอก */}
        {(
          [
            ["phone", "ເບີໂທ", "phone-pad", false],
            [
              "password",
              "ລະຫັດຜ່ານໃໝ່ (ເວັ້ນວ່າງ = ບໍ່ປ່ຽນ)",
              "default",
              true,
            ],
            ["fullName", "ຊື່ເຕັມ", "default", false],
            ["nickName", "ຊື່ຫຼິ້ນ", "default", false],
            ["position", "ຕຳແໜ່ງ", "default", false],
          ] as const
        ).map(([key, label, keyboard, secure]) => (
          <View key={key} className="mt-4">
            <Text className="mb-1 font-lao text-sm text-slate-700">
              {label}
            </Text>
            <TextInput
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-lao text-base text-slate-900"
              value={form[key]}
              keyboardType={keyboard}
              secureTextEntry={secure}
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
              onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))}
            />
          </View>
        ))}

        {/* ปุ่มบันทึก */}
        <Pressable
          className="mt-6 items-center rounded-xl py-4 active:opacity-80"
          style={{ backgroundColor: "#0772BA" }}
          disabled={isSaving}
          onPress={save}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-lao text-base text-white">ບັນທຶກ</Text>
          )}
        </Pressable>

        {/* ลบบัญชี */}
        <Pressable
          className="mb-10 mt-8 flex-row items-center justify-center gap-1 rounded-xl border border-red-200 py-4 active:bg-red-50"
          onPress={deleteAccount}
        >
          <MaterialCommunityIcons
            name="account-remove"
            size={20}
            color="red"
          />
          <Text className="font-lao text-base text-red-500">
            ລົບບັນຊີຖາວອນ
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}