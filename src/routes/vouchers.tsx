import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { VoucherCard } from "@/components/voucher-card";
import { vouchers } from "@/lib/mock-data";

export const Route = createFileRoute("/vouchers")({
  head: () => ({ meta: [{ title: "Ưu đãi — Ăn Hòa Lạc" }] }),
  component: VouchersPage,
});

function VouchersPage() {
  return (
    <AppShell>
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold">Ưu đãi của bạn</h1>
        <p className="text-sm text-muted-foreground">
          Áp dụng tại trang giỏ hàng khi thanh toán. Voucher chỉ giảm tiền món, không
          giảm phí ship.
        </p>
      </div>
      <div className="grid gap-3 px-4 pb-24 sm:grid-cols-2">
        {vouchers.map((v) => (
          <VoucherCard key={v.id} voucher={v} />
        ))}
      </div>
    </AppShell>
  );
}
