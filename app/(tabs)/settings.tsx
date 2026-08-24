import { Text, View, SafeAreaView, ScrollView } from "../../components/ui";
import Profile from "../../components/Setting/Profile";
import MenuList from "../../components/Setting/MenuList";
import { useAuth } from "../../context/auth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView>
        <View className="p-6">
          <Profile
            img={user?.image}
            name={user?.fullName ?? ""}
            nickName={user?.nickName ?? ""}
            position={user?.position ?? ""}
            role={user?.role ?? ""}
          />
          <MenuList />
        </View>
      </ScrollView>
    </View>
  );
}
