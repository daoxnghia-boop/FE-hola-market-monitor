import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { VoucherCard } from "@/components/voucher-card";
import { useVouchers } from "@/lib/api/hooks";
import { EmptyState } from "@/components/empty-state";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/vouchers")({
  head: () => ({ meta: [{ title: "Ưu đãi — Ăn Hòa Lạc" }] }),
  component: VouchersPage,
});

function VouchersPage() {
  const { data: vouchers = [], isLoading, isError } = useVouchers();
  return (
    <AppShell>
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold">Ưu đãi của bạn</h1>
        <p className="text-sm text-muted-foreground">
          Áp dụng tại trang giỏ hàng khi thanh toán. Voucher chỉ giảm tiền món, không giảm phí ship.
        </p>
      </div>
      <div className="grid gap-3 px-4 pb-24 sm:grid-cols-2">
        {isLoading && <p className="text-sm text-muted-foreground">Đang tải ưu đãi...</p>}
        {isError && (
          <p className="text-sm text-destructive">Chưa thể tải ưu đãi. Vui lòng thử lại sau.</p>
        )}
        {!isLoading && !isError && vouchers.length === 0 && (
          <EmptyState
            icon={<Ticket className="size-6" />}
            title="Chưa có ưu đãi"
            description="Voucher mới sẽ xuất hiện tại đây."
          />
        )}
        {vouchers.map((v) => (
          <VoucherCard key={v.id} voucher={v} />
        ))}
      </div>
    </AppShell>
  );
}
