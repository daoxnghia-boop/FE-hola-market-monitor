import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminVouchers, useAdminVoucherMutations } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineFetchingBar } from "@/components/admin-skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import type { VoucherDto } from "@/lib/api/types";

export const Route = createFileRoute("/admin/vouchers")({
  component: AdminVouchers,
});

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(20)
      .regex(/^[A-Z0-9]+$/, "Mã phải chữ HOA hoặc số"),
    title: z.string().trim().min(3),
    description: z.string().trim().min(3),
    discountType: z.enum(["fixed", "percent"]),
    discountValue: z.coerce.number().min(1),
    maxDiscount: z.coerce.number().min(0).optional(),
    minOrderAmount: z.coerce.number().min(0),
    startsAt: z.string().optional(),
    expiresAt: z.string().min(1, "Bắt buộc"),
    usageLimit: z.coerce.number().min(0).optional(),
    perUserLimit: z.coerce.number().min(0).optional(),
  })
  .refine((v) => v.discountType !== "percent" || (v.discountValue <= 100 && v.discountValue >= 1), {
    message: "Phần trăm phải 1-100",
    path: ["discountValue"],
  })
  .refine((v) => v.discountType !== "percent" || (v.maxDiscount ?? 0) > 0, {
    message: "Cần giảm tối đa cho voucher %",
    path: ["maxDiscount"],
  })
  .refine((v) => !v.startsAt || new Date(v.expiresAt) > new Date(v.startsAt), {
    message: "Hạn phải sau ngày bắt đầu",
    path: ["expiresAt"],
  });
type FormData = z.infer<typeof schema>;

function AdminVouchers() {
  const vouchers = useAdminVouchers();
  const { create, action } = useAdminVoucherMutations();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{vouchers.data?.length ?? 0} voucher</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Tạo voucher
            </Button>
          </DialogTrigger>
          <VoucherFormDialog
            onSubmit={async (data) => {
              try {
                await create.mutateAsync({ ...data, status: "usable" });
                toast.success("Đã tạo voucher.");
                setOpen(false);
              } catch (e) {
                toast.error(apiErrorMessage(e));
              }
            }}
            pending={create.isPending}
          />
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-4 pt-2"><InlineFetchingBar show={__FETCHING__} /></div>
        {vouchers.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !vouchers.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chưa có voucher.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Giảm</TableHead>
                  <TableHead>Tối thiểu</TableHead>
                  <TableHead>Hạn</TableHead>
                  <TableHead>Đã dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.data.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold">{v.code}</TableCell>
                    <TableCell className="text-sm">{v.title}</TableCell>
                    <TableCell className="text-sm">
                      {v.discountType === "fixed"
                        ? formatVND(v.discountValue)
                        : `${v.discountValue}%`}
                      {v.maxDiscount ? ` (tối đa ${formatVND(v.maxDiscount)})` : ""}
                    </TableCell>
                    <TableCell className="text-sm">{formatVND(v.minOrderAmount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.usedCount ?? 0}
                      {v.usageLimit ? ` / ${v.usageLimit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.enabled === false ? "secondary" : "outline"}>
                        {v.enabled === false ? "Đã tắt" : "Đang bật"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await action.mutateAsync({
                              id: v.id,
                              action: v.enabled === false ? "enable" : "disable",
                            });
                            toast.success("Đã cập nhật.");
                          } catch (e) {
                            toast.error(apiErrorMessage(e));
                          }
                        }}
                      >
                        {v.enabled === false ? "Bật" : "Tắt"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function VoucherFormDialog({
  onSubmit,
  pending,
}: {
  onSubmit: (v: FormData) => void;
  pending: boolean;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      discountType: "fixed",
      discountValue: 10000,
      minOrderAmount: 50000,
      expiresAt: new Date(Date.now() + 30 * 86400e3).toISOString().slice(0, 10),
    },
  });
  const dt = form.watch("discountType");

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Tạo voucher mới</DialogTitle>
        <DialogDescription>Điền thông tin voucher. Mã sẽ được viết HOA.</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={form.handleSubmit(onSubmit as (v: FormData) => Promise<void> | void)}
        className="grid gap-3 sm:grid-cols-2"
      >
        <div className="sm:col-span-2 space-y-1">
          <Label>Mã voucher</Label>
          <Input
            {...form.register("code")}
            placeholder="HOLA10"
            onChange={(e) => form.setValue("code", e.target.value.toUpperCase())}
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label>Tiêu đề</Label>
          <Input {...form.register("title")} />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label>Mô tả</Label>
          <Input {...form.register("description")} />
        </div>
        <div className="space-y-1">
          <Label>Kiểu giảm</Label>
          <Select
            value={dt}
            onValueChange={(v) => form.setValue("discountType", v as "fixed" | "percent")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Số tiền (VND)</SelectItem>
              <SelectItem value="percent">Phần trăm (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{dt === "percent" ? "% giảm (1-100)" : "Số tiền giảm"}</Label>
          <Input type="number" {...form.register("discountValue")} />
          {form.formState.errors.discountValue && (
            <p className="text-xs text-destructive">
              {form.formState.errors.discountValue.message}
            </p>
          )}
        </div>
        {dt === "percent" && (
          <div className="space-y-1 sm:col-span-2">
            <Label>Giảm tối đa (VND)</Label>
            <Input type="number" {...form.register("maxDiscount")} />
            {form.formState.errors.maxDiscount && (
              <p className="text-xs text-destructive">
                {form.formState.errors.maxDiscount.message}
              </p>
            )}
          </div>
        )}
        <div className="space-y-1">
          <Label>Đơn tối thiểu</Label>
          <Input type="number" {...form.register("minOrderAmount")} />
        </div>
        <div className="space-y-1">
          <Label>Hạn dùng</Label>
          <Input type="date" {...form.register("expiresAt")} />
          {form.formState.errors.expiresAt && (
            <p className="text-xs text-destructive">{form.formState.errors.expiresAt.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Giới hạn lượt</Label>
          <Input type="number" {...form.register("usageLimit")} placeholder="Không giới hạn" />
        </div>
        <div className="space-y-1">
          <Label>Mỗi user</Label>
          <Input type="number" {...form.register("perUserLimit")} placeholder="Không giới hạn" />
        </div>
        <DialogFooter className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            Tạo voucher
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
// silence unused-import in some builds
void ({} as VoucherDto);
