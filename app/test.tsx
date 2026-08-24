import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View } from "../components/ui";

const Test = () => {
  const [auth, setAuth] = useState<{ token: string, user: any } | null>(null);

  useEffect(() => {
    (async () => {
      const localData = await AsyncStorage.getItem("auth");
      if (localData) {
        setAuth(JSON.parse(localData));
      }
    })();
  }, []);

  return (
    <View>
      <Text>{auth?.token ?? "ไม่มีข้อมูล"}</Text>
      <Text>{auth?.user?.fullName ?? "ไม่มีข้อมูลผู้ใช้"}</Text>
    </View>
  );
};

export default Test;