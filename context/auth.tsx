import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setAuthToken } from "../services/api";
import type { User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "auth_token"; // เก็บแค่ token อย่างเดียว

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // เปิดแอป: อ่าน token จากเครื่อง → ดึง user สดจาก API
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!savedToken) return; // ไม่เคย login

        setAuthToken(savedToken);

        // ดึงโปรไฟล์จาก server — สำเร็จค่อยถือว่า login อยู่
        const profile = await api.profile.me();
        setToken(savedToken);
        setUser(profile);
      } catch {
        // token หมดอายุ/ใช้ไม่ได้ → ล้างทิ้ง ให้ไป login ใหม่
        await AsyncStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.auth.login({ phone, password });
    setToken(res.token);
    setUser(res.user); // ใช้ user จาก response ได้เลย เพิ่งมาจาก server สดๆ
    setAuthToken(res.token);
    await AsyncStorage.setItem(TOKEN_KEY, res.token); // เก็บแค่ token
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  };

  const refreshProfile = async () => {
    const fresh = await api.profile.me();
    setUser(fresh); // ไม่ต้องเขียนลง storage แล้ว เพราะไม่ได้เก็บ user
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth ต้องใช้ภายใน <AuthProvider>");
  return ctx;
}