import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forbidden")({
  head: () => ({ meta: [{ title: "Không có quyền — HoLa Market" }] }),
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Bạn không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang này chỉ dành cho tài khoản quản trị viên. Nếu bạn cho rằng đây là nhầm lẫn, vui
          lòng liên hệ đội hỗ trợ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg"><Link to="/">Về trang chủ</Link></Button>
          <Button asChild variant="outline" size="lg"><Link to="/login">Đăng nhập lại</Link></Button>
        </div>
      </div>
    </div>
  );
}
