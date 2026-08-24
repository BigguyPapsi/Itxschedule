import { Text, View } from "../components/ui";
import { useAuth } from "../context/auth";

export default function Test1() {
  const { user } = useAuth();

  return (
    <View className="p-6">
      <Text className="font-lao text-base">
        {user?.fullName}
      </Text>
      <Text className="text-sm text-slate-500">{user?.position}</Text>
    </View>
  );
}