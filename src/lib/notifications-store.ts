import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useUnreadQuery,
} from "./api/hooks";

export type { NotificationDto as AppNotification, NotificationType } from "./api/types";

export function useNotifications() {
  const query = useNotificationsQuery();
  return query.data?.items ?? [];
}

export function useNotificationsState() {
  return useNotificationsQuery();
}

export function useUnreadCount() {
  return useUnreadQuery().data?.unreadCount ?? 0;
}

export const useMarkRead = useMarkNotificationRead;
export const useMarkAllRead = useMarkAllNotificationsRead;
