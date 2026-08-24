import Entypo from "@expo/vector-icons/Entypo";
import { Image, Ionicons, Link, Pressable, Text, View } from "../ui";

interface ProfileProps {
  img?: string | null;
  name: string;
  nickName?: string;
  position?: string;
  role?: string;
}

export default function Profile({
  img,
  name,
  nickName,
  position,
}: ProfileProps) {
  return (
    <Link href="/edit" asChild>
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View className="flex-1 flex-row items-center gap-3">
          {/* avatar: รูปจริง หรือวงฟ้าอ่อน */}
          {img ? (
            <Image
              source={{ uri: img }}
              style={{ width: 64, height: 64, borderRadius: 32 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 64, height: 64, backgroundColor: "#dbeafe" }}
            >
              <Ionicons name="person-circle" size={52} color="#0772BA" />
            </View>
          )}

          <View className="flex-1">
            {/* chip ชื่อเล่น + ชื่อเต็ม */}
            <View className="flex-row items-center gap-2">
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: "#0772BA" }}
              >
                <Text className="font-lao-bold text-sm text-white">
                  {nickName || "---"}
                </Text>
              </View>
              <Text
                className="font-lao-bold text-lg text-slate-900"
                numberOfLines={1}
              >
                {name}
              </Text>
            </View>

            {/* ตำแหน่ง */}
            <Text className="mt-1 font-lao text-sm text-slate-400">
              Position: {position || "---"}
            </Text>
          </View>
        </View>

        <Entypo name="chevron-right" size={24} color="#0772BA" />
      </Pressable>
    </Link>
  );
}