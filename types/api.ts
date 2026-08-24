// ---------- Auth ----------
export interface User {
  id: number;
  staffID: string;
  phone: string;
  role: string;
  image: string | null;
  fullName: string;
  nickName: string;
  position: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ---------- ส่วนกลาง ----------
export interface ApiError {
  status: number;
  message: string;
}

// ---------- Schedule ----------
export interface ScheduleStaff {
  image?: string | null;
  fullName: string;
  nickName: string;
  position: string;
}

export interface ScheduleDay {
  date: string; // "10/09/2026"
  day: string; // "thursday"
  staff: ScheduleStaff[];
}
// ---------- Monitor ----------
export interface MonitorStaff {
  userID: number;
  image: string | null;
  fullName: string;
  nickName: string;
  position: string;
  mDate: string[]; // ["11/09/2026", ...]
}

export interface SaveDatesRequest {
  userID: number;
  mDate: string[];
}
// ---------- Monitoring (เวรวันนี้/พรุ่งนี้) ----------
export interface MonitoringToday {
  today: string; // "13/08/2026"
  day: string;
  staff: ScheduleStaff[];
}

export interface MonitoringTomorrow {
  tomorrow: string; // "14/08/2026"
  day: string;
  staff: ScheduleStaff[];
}
export interface SwapOther {
  date: string; // "13/08/2026"
  userID: number;
  fullName: string;
  nickName: string;
  position: string;
}

export interface SwapMine {
  date: string;
}

// ---------- Bulk upload (จาก QR) ----------
export interface BulkStaffItem {
  staffID: string;
  name: string;
  date: string[];
}
export interface SwapRequest {
  myDate: string;
  targetUserID: number;
  targetDate: string;
}
// ---------- Swap requests ----------
export interface SwapParty {
  userID: number;
  staffID: string;
  fullName: string;
  nickName: string;
  date: string;
}

export interface SwapRequestItem {
  id: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  from: SwapParty;
  to: SwapParty;
  createdAt: string;
  respondedAt: string | null;
}

export interface SwapRequestsResponse {
  incoming: SwapRequestItem[];
  outgoing: SwapRequestItem[];
}

// ---------- Notifications ----------
export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  sentBy: string;
  createdAt: string;
}

export interface SendNotificationRequest {
  title: string;
  message: string;
}

// ---------- Scheduled notifications ----------
export interface ScheduledNotification {
  id: number;
  time: string; // "14:34"
  title: string;
  message: string;
  enabled: boolean;
  createdAt: string;
}

export interface ScheduledNotificationRequest {
  time: string;
  title: string;
  message: string;
  enabled?: boolean;
}
