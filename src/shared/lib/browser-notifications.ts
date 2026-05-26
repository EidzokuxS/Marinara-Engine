type BrowserNotificationPermission = NotificationPermission | "unsupported";

export type ConversationBrowserNotificationOptions = {
  enabled: boolean;
  characterName?: string | null;
  tag?: string;
};

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (window.Notification.permission !== "default") return window.Notification.permission;
  return window.Notification.requestPermission();
}

export function isAppFocusedForNotifications(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible" && document.hasFocus();
}

export function shouldShowConversationBrowserNotification({
  enabled,
  permission,
  appFocused,
}: {
  enabled: boolean;
  permission: BrowserNotificationPermission;
  appFocused: boolean;
}) {
  return enabled && permission === "granted" && !appFocused;
}

export function showConversationBrowserNotification({
  enabled,
  characterName,
  tag,
}: ConversationBrowserNotificationOptions): boolean {
  const permission = getBrowserNotificationPermission();
  if (
    !shouldShowConversationBrowserNotification({
      enabled,
      permission,
      appFocused: isAppFocusedForNotifications(),
    }) ||
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return false;
  }

  const name = typeof characterName === "string" && characterName.trim() ? characterName.trim() : "Character";
  const notification = new window.Notification(`New message from ${name.slice(0, 80)}`, {
    body: "Open Marinara to read it.",
    icon: "/icon-192.png",
    tag,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return true;
}
