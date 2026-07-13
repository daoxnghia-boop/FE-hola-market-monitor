import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useAdminUsers, useAdminUserAction, useCurrentUser } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import type { AdminUserSummaryDto } from "@/lib/api/types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const ROLE_LABEL = { customer: "Khách hàng", shop_owner: "Chủ quán", admin: "Quản trị" } as const;

function AdminUsers() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const users = useAdminUsers({
    q, role: role === "all" ? undefined : role, status: status === "all" ? undefined : status,
  });
  const action = useAdminUserAction();
  const me = useCurrentUser();
  const [blockTarget, setBlockTarget] = useState<AdminUserSummaryDto | null>(null);
  const [reason, setReason] = useState("");

  const doBlock = async () => {
    if (!blockTarget || !reason.trim()) return;
    try {
      await action.mutateAsync({ id: blockTarget.id, action: "block", reason: reason.trim() });
      toast.success("Đã khóa tài khoản.");
      setBlockTarget(null); setReason("");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };
  const unblock = async (u: AdminUserSummaryDto) => {
    try {
      await action.mutateAsync({ id: u.id, action: "unblock" });
      toast.success("Đã mở khóa.");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, SĐT, email..." className="pl-9" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="customer">Khách hàng</SelectItem>
            <SelectItem value="shop_owner">Chủ quán</SelectItem>
            <SelectItem value="admin">Quản trị</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="blocked">Bị khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {users.isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !users.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Không có người dùng.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đơn</TableHead>
                  <TableHead>Chi tiêu</TableHead>
                  <TableHead>Đăng ký</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold">{u.fullName}</TableCell>
                    <TableCell className="text-sm">{u.phone}</TableCell>
                    <TableCell className="text-sm">{u.email ?? "—"}</TableCell>
                    <TableCell><Badge variant={u.role === "admin" ? "default" : "outline"}>{ROLE_LABEL[u.role]}</Badge></TableCell>
                    <TableCell><Badge variant={u.status === "active" ? "outline" : "destructive"}>{u.status === "active" ? "Hoạt động" : "Bị khóa"}</Badge></TableCell>
                    <TableCell className="text-sm">{u.orderCount}</TableCell>
                    <TableCell className="text-sm">{formatVND(u.totalSpending)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      {u.id !== me?.id && (
                        u.status === "active"
                          ? <Button size="sm" variant="destructive" onClick={() => { setBlockTarget(u); setReason(""); }}>Khóa</Button>
                          : <Button size="sm" variant="outline" onClick={() => unblock(u)}>Mở khóa</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!blockTarget} onOpenChange={(o) => !o && setBlockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa tài khoản {blockTarget?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Người dùng sẽ không thể đăng nhập. Vui lòng nhập lý do rõ ràng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do khóa..." rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction onClick={doBlock} disabled={!reason.trim() || action.isPending}>Khóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
