import { useEffect } from "react";
import { NotificationService } from "@/services/NotificationService";

export default function PushNotificationClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    NotificationService.requestPermission();
    // Optionally subscribe user to push notifications here
    // NotificationService.subscribeUserToPush();
  }, []);
  return null;
}
