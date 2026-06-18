import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/mock-data";

const STEP_TIMES: Record<OrderStatus, string> = {
  da_dat: "Vừa xong",
  cho_quan_xac_nhan: "1 phút trước",
  quan_da_xac_nhan: "2 phút trước",
  dang_chuan_bi: "Đang xử lý",
  dang_giao: "Dự kiến 10 phút",
  hoan_thanh: "—",
  da_huy: "—",
};

export function OrderTimeline({ current }: { current: OrderStatus }) {
  if (current === "da_huy") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Đơn hàng đã bị hủy. Liên hệ quán nếu cần hỗ trợ.
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(current);

  return (
    <ol className="relative space-y-5">
      {ORDER_STATUS_FLOW.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const isLast = idx === ORDER_STATUS_FLOW.length - 1;
        return (
          <li key={step} className="relative flex gap-3">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-9 h-[calc(100%-8px)] w-0.5",
                  done ? "bg-success" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 transition",
                done && "border-success bg-success text-success-foreground",
                active &&
                  "border-primary bg-primary text-primary-foreground shadow-pop ring-4 ring-primary/15",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-4" />
              ) : active ? (
                <Clock className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>
            <div className="flex-1 pb-1">
              <div
                className={cn(
                  "font-semibold",
                  active && "text-primary",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABEL[step]}
              </div>
              <div className="text-xs text-muted-foreground">
                {active || done ? STEP_TIMES[step] : "Chưa cập nhật"}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
