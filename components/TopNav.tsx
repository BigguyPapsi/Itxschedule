import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

// ---------- config แต่ละหน้า ----------
type NavConfig = {
  path: string;
  title: string;
  backBtn: boolean;
};

const NAV_CONFIG: NavConfig[] = [
  { path: "/", title: "ໜ້າຫຼັກ", backBtn: false },
  { path: "/schedule", title: "ຕາຕະລາງເຂົ້າກະ", backBtn: false },
  { path: "/history", title: "ປະຫວັດການ", backBtn: false },
  { path: "/settings", title: "ຕັ້ງຄ່າ", backBtn: false },
  { path: "/profile", title: "ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ", backBtn: true },
  { path: "/mUser", title: "ຈັດການຜູ້ໃຊ້", backBtn: true },
  { path: "/mDate", title: "ຈັດການວັນປະຈຳການ", backBtn: true },
  { path: "/swap", title: "ສະຫຼັບວັນເຂົ້າກະ", backBtn: true },
  { path: "/swapRequests", title: "ຄຳຂໍສະຫຼັບກະ", backBtn: true },
  { path: "/scanQR", title: "ສະແກນ QR", backBtn: true },
  { path: "/edit", title: "ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ", backBtn: true },
  { path: "/mangeUsers", title: "ຈັດການຜູ້ໃຊ້", backBtn: true },
  { path: "/about", title: "ກ່ຽວກັບແອັບ", backBtn: true },
  { path: "/scheduledNoti", title: "ຕັ້ງເວລາແຈ້ງເຕືອນ", backBtn: true },
  { path: "/notiCreate", title: "ສົ່ງແຈ້ງເຕືອນ", backBtn: true },
  { path: "/notiHistory", title: "ປະຫວັດແຈ້ງເຕືອນ", backBtn: true },
];

export default function TopNav() {
  const pathname = usePathname();

  const config = NAV_CONFIG.find((c) => c.path === pathname);
  if (!config) return null;

  return (
    <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
      <View className="w-20">
        {config.backBtn && (
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 active:opacity-60"
          >
            <Ionicons name="chevron-back" size={22} color="#0f172a" />
            <Text className="font-lao text-base text-slate-900">ກັບຄືນ</Text>
          </Pressable>
        )}
      </View>

      <View className="flex-1 items-center">
        <Text
          className="font-lao-bold text-base text-slate-900"
          numberOfLines={1}
        >
          {config.title}
        </Text>
      </View>

      <View className="w-20" />
    </View>
  );
}