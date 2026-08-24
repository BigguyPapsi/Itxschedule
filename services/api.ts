import type {
  ApiError,
  NotificationItem,
  SendNotificationRequest,
  ScheduledNotification,
  ScheduledNotificationRequest,
  LoginRequest,
  LoginResponse,
  MonitoringToday,
  MonitoringTomorrow,
  MonitorStaff,
  SaveDatesRequest,
  ScheduleDay,
  SwapOther,
  SwapMine,
  SwapRequestsResponse,
  SwapRequestItem,
  SwapRequest,
  BulkStaffItem,
  User,
} from "../types/api";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// token ปัจจุบัน (ตั้งค่าโดย context/auth.tsx หลัง login)
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// ---------- แปลข้อความ error จาก backend เป็นลาว ----------
// ไม่รู้จักข้อความไหน = โชว์ต้นฉบับ / เจอข้อความใหม่ก็เพิ่มบรรทัดได้เรื่อยๆ
const ERROR_TRANSLATIONS: Record<string, string> = {
  "This phone number is already registered": "ເບີໂທນີ້ຖືກລົງທະບຽນແລ້ວ",
};

const translateError = (msg: string) => ERROR_TRANSLATIONS[msg] ?? msg;

// ---------- แปลง response ที่ไม่ ok เป็น ApiError ----------
const toApiError = (status: number, data: any): ApiError => ({
  status,
  message: translateError(
    data?.message ?? data?.error ?? `ເກີດຂໍ້ຜິດພາດ (${status})`,
  ),
});

// ---------- ตัวยิง request กลาง (JSON) ----------
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw toApiError(res.status, data);
  }

  return data as T;
}

// ---------- ตัวยิง request แบบมีไฟล์ (multipart/form-data) ----------
// ห้ามตั้ง Content-Type เอง — fetch จะใส่ boundary ให้อัตโนมัติ
async function apiUpload<T>(
  path: string,
  method: "POST" | "PUT",
  form: FormData,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: form,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw toApiError(res.status, data);
  }

  return data as T;
}

// ---------- รวมทุก API ไว้ที่นี่ ----------
export const api = {
  auth: {
    login: (body: LoginRequest) =>
      apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  profile: {
    me: () => apiFetch<User>("/api/profile/me"),
    update: (form: FormData) => apiUpload<User>("/api/profile/me", "PUT", form),
    remove: () => apiFetch<unknown>("/api/profile/me", { method: "DELETE" }),
  },

  schedule: {
    getAll: () => apiFetch<ScheduleDay[]>("/api/schedule"),
  },

  monitor: {
    getAll: () => apiFetch<MonitorStaff[]>("/api/monitor/staff"),

    // เพิ่มวันให้ user (ใช้ตอน user ยังไม่มีวันเลย)
    addDates: (body: SaveDatesRequest) =>
      apiFetch<unknown>("/api/monitor/staff", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    // แทนที่วันทั้งหมดของ user
    updateDates: (userID: number, mDate: string[]) =>
      apiFetch<unknown>(`/api/monitor/staff/${userID}`, {
        method: "PUT",
        body: JSON.stringify({ mDate }),
      }),

    // ล้างวันของ user คนเดียว
    resetUser: (userID: number) =>
      apiFetch<unknown>(`/api/monitor/staff/${userID}`, { method: "DELETE" }),

    // ล้างวันทุกคน
    resetAll: () =>
      apiFetch<unknown>("/api/monitor/reset", { method: "DELETE" }),
    bulkUpload: (body: BulkStaffItem[]) =>
      apiFetch<unknown>("/api/monitor/staff/bulk", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  users: {
    getAll: () => apiFetch<User[]>("/api/users"),
    create: (form: FormData) => apiUpload<unknown>("/api/users", "POST", form),
    update: (id: number, form: FormData) =>
      apiUpload<unknown>(`/api/users/${id}`, "PUT", form),
    remove: (id: number) =>
      apiFetch<unknown>(`/api/users/${id}`, { method: "DELETE" }),
  },

  monitoring: {
    today: () => apiFetch<MonitoringToday>("/api/monitoring/today"),
    tomorrow: () => apiFetch<MonitoringTomorrow>("/api/monitoring/tomorrow"),
  },
  swap: {
    history: () => apiFetch<SwapRequestItem[]>("/api/swap/history"),
    others: () => apiFetch<SwapOther[]>("/api/swap/others"),
    mine: () => apiFetch<SwapMine[]>("/api/swap/mine"),
    request: (body: SwapRequest) =>
      apiFetch<unknown>("/api/swap", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    requests: () => apiFetch<SwapRequestsResponse>("/api/swap/requests"),
    accept: (id: number) =>
      apiFetch<unknown>(`/api/swap/requests/${id}/accept`, { method: "POST" }),
    reject: (id: number) =>
      apiFetch<unknown>(`/api/swap/requests/${id}/reject`, { method: "POST" }),
    cancel: (id: number) =>
      apiFetch<unknown>(`/api/swap/requests/${id}`, { method: "DELETE" }),
  },

  notifications: {
    history: () => apiFetch<NotificationItem[]>("/api/notifications/history"),
    send: (body: SendNotificationRequest) =>
      apiFetch<unknown>("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    scheduled: () =>
      apiFetch<ScheduledNotification[]>("/api/notifications/scheduled"),
    createScheduled: (body: ScheduledNotificationRequest) =>
      apiFetch<unknown>("/api/notifications/scheduled", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateScheduled: (id: number, body: ScheduledNotificationRequest) =>
      apiFetch<unknown>(`/api/notifications/scheduled/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    removeScheduled: (id: number) =>
      apiFetch<unknown>(`/api/notifications/scheduled/${id}`, {
        method: "DELETE",
      }),
  },
};
