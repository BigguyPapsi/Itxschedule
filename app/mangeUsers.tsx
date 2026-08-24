import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator,
  Image,
  Ionicons,
  Pressable,
  router,
  SafeAreaView,
  Text,
  View,
} from "../components/ui";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import type { ApiError, User } from "../types/api";

// ฟอร์มเปล่า
const EMPTY_FORM = {
  staffID: "",
  phone: "",
  password: "",
  role: "user" as "user" | "admin",
  fullName: "",
  nickName: "",
  position: "",
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

// แจ้ง error เป็น popup — เห็นได้แม้ Modal เปิดอยู่
const showError = (message: string) => {
  if (Platform.OS === "web") {
    window.alert(message);
    return;
  }
  Alert.alert("ຜິດພາດ", message, [{ text: "ຕົກລົງ" }]);
};

export default function MUser() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sheet ฟอร์ม: null = ปิด, "new" = เพิ่มใหม่, User = แก้ไขคนนั้น
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pickedImage, setPickedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ปิด sheet
  const closeSheet = () => setEditing(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setUsers(await api.users.getAll());
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

  // ---------- กันคนไม่ใช่ admin ----------
  if (me?.role !== "admin") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Ionicons name="lock-closed-outline" size={48} color="#94a3b8" />
        <Text className="mt-3 font-lao text-base text-slate-500">
          ບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້
        </Text>
      </View>
    );
  }

  // ---------- เปิดฟอร์ม ----------
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setPickedImage(null);
    setEditing("new");
  };

  const openEdit = (u: User) => {
    setForm({
      staffID: u.staffID ?? "",
      phone: u.phone,
      password: "",
      role: u.role === "admin" ? "admin" : "user",
      fullName: u.fullName,
      nickName: u.nickName,
      position: u.position,
    });
    setPickedImage(null);
    setEditing(u);
  };

  // ---------- เลือกรูป ----------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPickedImage(result.assets[0]);
  };

  // ---------- บันทึก ----------
  const save = async () => {
    if (!form.staffID || !form.phone || !form.fullName) {
      showError("ກະລຸນາປ້ອນລະຫັດພະນັກງານ, ເບີໂທ ແລະ ຊື່ເຕັມ");
      return;
    }
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("staffID", form.staffID);
      fd.append("phone", form.phone);
      if (form.password) fd.append("password", form.password);
      fd.append("role", form.role);
      fd.append("fullName", form.fullName);
      fd.append("nickName", form.nickName);
      fd.append("position", form.position);
      if (pickedImage) {
        // มือถือ: ส่งเป็น { uri, name, type }
        fd.append("image", {
          uri: pickedImage.uri,
          name: pickedImage.fileName ?? "avatar.jpg",
          type: pickedImage.mimeType ?? "image/jpeg",
        } as unknown as Blob);
      }

      if (editing === "new") {
        await api.users.create(fd);
      } else if (editing) {
        await api.users.update(editing.id, fd);
      }
      closeSheet();
      await load();
    } catch (e) {
      // sheet ยังเปิดอยู่ ให้แก้แล้วกดบันทึกใหม่ได้เลย
      showError((e as ApiError).message ?? "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- ลบ ----------
  const removeUser = (u: User) =>
    confirmAction(
      "ລົບຜູ້ໃຊ້",
      `ລົບ ${u.nickName} ແທ້ບໍ? ຍ້ອນກັບຄືນບໍ່ໄດ້`,
      async () => {
        try {
          await api.users.remove(u.id);
          await load();
        } catch (e) {
          showError((e as ApiError).message ?? "ລົບບໍ່ສຳເລັດ");
        }
      },
    );

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
        contentContainerClassName="p-6"
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


        <View className="mt-3 flex-row items-center justify-end">

          <Pressable
            className="flex-row items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 active:bg-blue-700"
            onPress={openCreate}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="font-lao text-sm text-white">ເພີ່ມຜູ້ໃຊ້</Text>
          </Pressable>
        </View>

        {error && (
          <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-lao text-sm text-red-600">{error}</Text>
          </View>
        )}

        <View className="mt-4 gap-4">
          {users.map((u) => {
            const isMe = u.id === me?.id;
            return (
              <View
                key={u.id}
                className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"
              >
                {u.image ? (
                  <Image
                    source={{ uri: u.image }}
                    contentFit="cover"
                    style={{
                      width: 50,
                      height: 50,
                      borderWidth: 1,
                      borderColor: "#64748b",
                      borderRadius: 25,
                    }}
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                    <Ionicons name="person" size={22} color="#64748b" />
                  </View>
                )}

                <View className="ml-3 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-lao-bold text-base text-slate-900">
                      {u.nickName}
                    </Text>
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        u.role === "admin" ? "bg-green-100" : "bg-slate-100"
                      }`}
                    >
                      <Text
                        className={`text-[10px] ${
                          u.role === "admin"
                            ? "text-green-700"
                            : "text-slate-500"
                        }`}
                      >
                        {u.role}
                      </Text>
                    </View>
                    {isMe && (
                      <View className="rounded-full bg-blue-100 px-2 py-0.5">
                        <Text className="font-lao text-[10px] text-blue-700">
                          ທ່ານເອງ
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-lao text-sm text-slate-500">
                    {u.fullName} · {u.position}
                  </Text>

                  <View className="flex-row items-center">
                    <View className="bg-[#101e9c] px-2 rounded-full">
                    <Text className="text-xs text-white">
                      {u.staffID ? `${u.staffID}` : "---"}
                    </Text>
                    </View>

                    <Text>  - </Text>
                    <Text className="text-xs text-slate-400">{u.phone}</Text>
                  </View>

                  {/* <Text className="text-xs text-slate-400">
                    {u.staffID ? `${u.staffID} · ` : ""}
                    {u.phone}
                  </Text> */}
                </View>

                {/* ปุ่มแก้ไข/ลบ — ไม่โชว์สำหรับบัญชีตัวเอง */}
                {!isMe && (
                  <>
                    <Pressable
                      className="rounded-xl bg-blue-600 px-3 py-2 active:bg-blue-700"
                      onPress={() => openEdit(u)}
                    >
                      <Text className="font-lao text-sm text-white">ແກ້ໄຂ</Text>
                    </Pressable>
                    <Pressable
                      className="ml-2 rounded-xl bg-slate-100 p-2 active:bg-red-100"
                      onPress={() => removeUser(u)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ---------- Sheet ฟอร์มเพิ่ม/แก้ไข ---------- */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View className="flex-1 justify-end bg-black/50">
          {/* แผ่นสูงคงที่ — height ใส่ผ่าน style */}
          <View
            className="rounded-t-3xl bg-white px-6 pt-6"
            style={{ height: "90%" }}
          >
            <Text className="text-center font-lao-bold text-lg text-slate-900">
              {editing === "new" ? "ເພີ່ມຜູ້ໃຊ້ໃໝ່" : "ແກ້ໄຂຜູ້ໃຊ້"}
            </Text>

            {/* component ภายนอก — NativeWind ไม่รู้จัก className ต้องใช้ style */}
            <KeyboardAwareScrollView
              style={{ flex: 1, marginTop: 16 }}
              keyboardShouldPersistTaps="handled"
              bottomOffset={100}
            >
              {/* รูปโปรไฟล์ */}
              <Pressable className="items-center" onPress={pickImage}>
                {pickedImage ? (
                  <Image
                    source={{ uri: pickedImage.uri }}
                    style={{
                      width: 80,
                      height: 80,
                      borderWidth: 1,
                      borderColor: "#64748b",
                      borderRadius: 40,
                    }}
                    contentFit="cover"
                  />
                ) : editing !== "new" && editing?.image ? (
                  <Image
                    source={{ uri: editing.image }}
                    style={{
                      width: 80,
                      height: 80,
                      borderWidth: 1,
                      borderColor: "#64748b",
                      borderRadius: 40,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-20 w-20 items-center justify-center rounded-full bg-slate-200">
                    <Ionicons name="camera" size={28} color="#64748b" />
                  </View>
                )}
                <Text className="mt-1 font-lao text-xs text-blue-600">
                  ແຕະເພື່ອເລືອກຮູບ
                </Text>
              </Pressable>

              {/* ช่องกรอก */}
              {(
                [
                  ["staffID", "ລະຫັດພະນັກງານ", "default", false],
                  ["phone", "ເບີໂທ", "phone-pad", false],
                  [
                    "password",
                    editing === "new"
                      ? "ລະຫັດຜ່ານ"
                      : "ລະຫັດຜ່ານ (ຍະວ່າງ = ບໍ່ມີຂໍ້ມູນ)",
                    "default",
                    true,
                  ],
                  ["fullName", "ຊື່ເຕັມ", "default", false],
                  ["nickName", "ຊື່ຫຼິ້ນ", "default", false],
                  ["position", "ຕຳແໜ່ງ", "default", false],
                ] as const
              ).map(([key, label, keyboard, secure]) => (
                <View key={key} className="mt-3">
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

              {/* เลือก role */}
              <Text className="mb-1 mt-3 font-lao text-sm text-slate-700">
                ສິດການໃຊ້ງານ
              </Text>
              <View className="mb-6 flex-row gap-2">
                {(["user", "admin"] as const).map((r) => (
                  <Pressable
                    key={r}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      form.role === r
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() => setForm((p) => ({ ...p, role: r }))}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        form.role === r ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </KeyboardAwareScrollView>

            {/* แถบปุ่มล่างติดขอบ (ท้ายแผ่น) */}
            <View
              className="-mx-6 flex-row gap-3 px-6 py-3"
              style={{
                backgroundColor: "#fff",
                borderTopWidth: 1,
                borderTopColor: "#cbcbd4",
              }}
            >
              <Pressable
                className="flex-1 items-center rounded-xl bg-slate-100 py-3 active:bg-slate-200"
                onPress={closeSheet}
              >
                <Text className="font-lao text-base text-slate-700">
                  ຍົກເລີກ
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-blue-600 py-3 active:bg-blue-700"
                disabled={isSaving}
                onPress={save}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-lao text-base text-white">ບັນທຶກ</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
