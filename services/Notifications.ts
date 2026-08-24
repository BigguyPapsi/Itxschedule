import React, { useEffect } from "react";
// Include the OneSignal package
import { OneSignal, LogLevel } from "react-native-onesignal";

export default function UseNoti() {
  useEffect(() => {
    // Enable verbose logging for debugging (remove in production)
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    // Replace with your OneSignal App ID from Dashboard > Settings > Keys & IDs
    OneSignal.initialize("daae7f1a-5206-41ef-80f4-0a4aff919a16");
    OneSignal.login("1");
    console.log('====================================');
    console.log("HEllo");
    console.log('====================================');
    // Prompt for push permission on first launch.
    // In production, consider using an in-app message instead for better opt-in rates.
    OneSignal.Notifications.requestPermission(false);

    // Define listeners once so the same reference is used to add and remove them.
    const clickListener = (event: any) => {
      console.log("OneSignal: notification clicked:", event);
    };

    // In v5, foreground notifications display automatically.
    // Call event.preventDefault() to suppress, then
    // event.getNotification().display() to show after async work.
    const foregroundListener = (event: any) => {
      console.log("OneSignal: foreground will display:", event);
    };

    OneSignal.Notifications.addEventListener("click", clickListener);
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      foregroundListener,
    );

    // Clean up listeners when the component unmounts to prevent memory leaks.
    // The same listener reference passed to addEventListener must be passed here.
    return () => {
      OneSignal.Notifications.removeEventListener("click", clickListener);
      OneSignal.Notifications.removeEventListener(
        "foregroundWillDisplay",
        foregroundListener,
      );
    };
  }, []);
}
