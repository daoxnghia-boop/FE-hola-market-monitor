import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, CheckCheck, Receipt, Store, Ticket, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import {
  useNotifications,
  useNotificationsState,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  type AppNotification,
  type NotificationType,
} from "@/lib/notifications-store";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/domain";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Thông báo — Ăn Hòa Lạc" },
      { name: "description", content: "Thông báo về đơn hàng, voucher và quán ăn quanh bạn." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS: Record<NotificationType, typeof Bell> = {
  order: Receipt,
  voucher: Ticket,
  shop: Store,
  system: Megaphone,
};

const ICON_BG: Record<NotificationType, string> = {
  order: "bg-primary/10 text-primary",
  voucher: "bg-warning/15 text-warning",
  shop: "bg-success/15 text-success",
  system: "bg-accent text-accent-foreground",
};

function NotificationsPage() {
  const list = useNotifications();
  const state = useNotificationsState();
  const unread = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const navigate = useNavigate();

  const handleClick = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.target?.type === "order" && n.target.id) {
      navigate({ to: "/orders/$orderId", params: { orderId: n.target.id } });
    } else if (n.target?.type === "voucher" || n.type === "voucher") {
      navigate({ to: "/vouchers" });
    } else if (n.target?.type === "shop" && n.target.id) {
      navigate({ to: "/shops/$shopId", params: { shopId: n.target.id } });
    }
  };

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("Đã đánh dấu tất cả thông báo là đã đọc"),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur md:top-16">
        <Link
          to="/"
          className="grid size-9 place-items-center rounded-full hover:bg-accent md:hidden"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 truncate text-base font-bold md:text-lg">Thông báo</h1>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-accent/80"
          >
            <CheckCheck className="size-3.5" />
            Đánh dấu đã đọc
          </button>
        )}
      </header>

      {state.isLoading ? (
        <div className="px-4 pt-6 text-sm text-muted-foreground">Đang tải thông báo...</div>
      ) : state.isError ? (
        <div className="px-4 pt-6 text-sm text-muted-foreground">Chưa có thông báo.</div>
      ) : list.length === 0 ? (
        <div className="px-4 pt-6">
          <EmptyState
            icon={<Bell className="size-6" />}
            title="Chưa có thông báo nào"
            description="Các cập nhật về đơn hàng, voucher và quán ăn sẽ hiển thị tại đây."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border px-2 pb-8">
          {list.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-accent/50",
                    !n.readAt && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      ICON_BG[n.type],
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p
                        className={cn(
                          "min-w-0 flex-1 text-sm",
                          !n.readAt ? "font-semibold" : "font-medium text-foreground/90",
                        )}
                      >
                        {n.title}
                      </p>
                      {!n.readAt && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Chưa đọc"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
