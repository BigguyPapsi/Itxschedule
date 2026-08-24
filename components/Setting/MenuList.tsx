import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type Href } from "expo-router";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import Octicons from "@expo/vector-icons/Octicons";
import {
  ActivityIndicator,
  AntDesign,
  FontAwesome5,
  Ionicons,
  Link,
  Pressable,
  Text,
  View,
} from "../../components/ui";
import { useAuth } from "../../context/auth";

const MENU_ITEMS: {
  title: string;
  icon: React.ReactNode;
  route: Href;
  role: string;
}[] = [
  {
    title: "ຈັດການຜູ້ໃຊ້",
    icon: (
      <MaterialCommunityIcons
        name="account-cog-outline"
        size={26}
        color="black"
      />
    ),
    route: "/mangeUsers",
    role: "admin",
  },
  {
    title: "ຈັດການວັນປະຈຳການ",
    icon: <MaterialIcons name="schedule" size={26} color="black" />,
    route: "/mDate",
    role: "admin",
  },
  {
    title: "ເພີ່ມກະທັງໝົດດ້ວຍ QR",
    icon: <AntDesign name="scan" size={24} color="black" />,
    route: "/scanQR",
    role: "admin",
  },
  {
    title: "ຕັ້ງເວລາແຈ້ງເຕືອນ",
    icon: <MaterialIcons name="alarm-add" size={24} color="black" />,
    route: "/scheduledNoti",
    role: "admin",
  },
  {
    title: "ສົ່ງແຈ້ງເຕືອນ",
    icon: <MaterialIcons name="forward-to-inbox" size={24} color="black" />,
    route: "/notiCreate",
    role: "admin",
  },
  {
    title: "ປະຫວັດແຈ້ງເຕືອນ",
    icon: <Ionicons name="notifications-outline" size={24} color="black" />,
    route: "/notiHistory",
    role: "user",
  },
  {
    title: "ສະຫຼັບວັນເຂົ້າກະ",
    icon: (
      <MaterialCommunityIcons
        name="swap-horizontal-circle-outline"
        size={24}
        color="black"
      />
    ),
    route: "/swap",
    role: "user",
  },

  {
    title: "ຄຳຂໍສະຫຼັບກະ",
    icon: <Ionicons name="chatbox-ellipses-outline" size={24} color="black" />,
    route: "/swapRequests",
    role: "user",
  },
  {
    title: "ກ່ຽວກັບແອັບ",
    icon: <AntDesign name="info-circle" size={24} color="black" />,
    route: "/about",
    role: "user",
  },
];

export default function MenuList() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const visibleMenu =
    user?.role === "admin"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.role === "user");

  const doLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("ຕ້ອງການອອກຈາກລະບົບແທ້ບໍ?")) doLogout();
      return;
    }
    Alert.alert("ອອກຈາກລະບົບ", "ຕ້ອງການອອກຈາກລະບົບແທ້ບໍ?", [
      { text: "ຍົກເລີກ", style: "cancel" },
      { text: "ອອກຈາກລະບົບ", style: "destructive", onPress: doLogout },
    ]);
  };

  return (
    <View
      style={{
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <View>
        {visibleMenu.map((item) => (
          <Link key={item.title} href={item.route} asChild>
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 10,
                marginBottom: 5,
                borderRadius: 5,
              }}
              className="active:bg-slate-100"
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ marginRight: 10 }}>{item.icon}</View>
                <Text className="font-lao">{item.title}</Text>

                {item.role === "admin" && (
                  <View className="flex-row items-center absolute right-4 rounded-full bg-green-200 px-2 py-1 ">
                    <Octicons name="unlock" size={16} color="green" />
                    <Text className="text-m text-green-800"> Only Admin</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Link>
        ))}
      </View>

      <Pressable
        className="mt-8 items-center rounded-[10px] bg-red-100 py-4 active:bg-red-500"
        disabled={isLoggingOut}
        onPress={handleLogout}
      >
        {({ pressed }) => (
          <>
            {isLoggingOut ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <View className="flex-row items-center">
                <Text
                  className={`font-lao text-base ml-1 ${
                    pressed ? "text-white" : "text-red-500"
                  }`}
                >
                  ອອກຈາກລະບົບ
                </Text>
              </View>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}
