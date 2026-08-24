// เวอร์ชันเว็บของ Notifications — Metro จะหยิบไฟล์ .web.ts นี้แทน Notifications.ts
// อัตโนมัติเมื่อ bundle สำหรับ web
//
// react-native-onesignal เรียก TurboModuleRegistry.getEnforcing ตั้งแต่ตอน import
// (ไม่ใช่ตอนเรียกใช้) ซึ่งพังบนเว็บ — เช็ค Platform.OS ที่จุดเรียกจึงกันไม่ได้
// ต้องกันไม่ให้ import เข้ามาตั้งแต่แรก
//
// push notification รองรับเฉพาะ iOS/Android — บนเว็บเป็น no-op
export default function UseNoti() {}
