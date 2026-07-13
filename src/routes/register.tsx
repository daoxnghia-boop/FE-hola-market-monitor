import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegister } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { consumeRedirectIntent, safeInternalPath } from "@/lib/redirect";

const schema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên đầy đủ").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, "Số điện thoại phải gồm 10 số"),
  email: z.string().trim().email("Email không hợp lệ").max(120).optional().or(z.literal("")),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "Bạn cần đồng ý điều khoản." }),
  }),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Đăng ký — HoLa Market" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    phone: typeof s.phone === "string" ? s.phone : "",
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const search = useSearch({ from: "/register" });
  const navigate = useNavigate();
  const register = useRegister();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: search.phone ?? "",
      email: "",
      acceptedTerms: false as unknown as true,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await register.mutateAsync({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        acceptedTerms: true,
      });
      toast.success("Tạo tài khoản thành công. Chào mừng bạn đến HoLa Market!");
      const dest = safeInternalPath(consumeRedirectIntent() ?? "/");
      navigate({ to: dest as never, replace: true });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Quay lại đăng nhập
        </Link>
        <div className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-bold">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nhanh gọn trong 30 giây.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input id="fullName" placeholder="Nguyễn Văn A" {...form.register("fullName")} />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="0912xxxxxx"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (tuỳ chọn)</Label>
              <Input
                id="email"
                type="email"
                placeholder="ban@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                id="tos"
                checked={form.watch("acceptedTerms")}
                onCheckedChange={(v) =>
                  form.setValue(
                    "acceptedTerms",
                    v === true ? (true as const) : (false as unknown as true),
                  )
                }
              />
              <span>
                Tôi đồng ý với{" "}
                <a className="text-primary hover:underline" href="#">
                  điều khoản sử dụng
                </a>{" "}
                và{" "}
                <a className="text-primary hover:underline" href="#">
                  chính sách quyền riêng tư
                </a>
                .
              </span>
            </label>
            {form.formState.errors.acceptedTerms && (
              <p className="text-xs text-destructive">
                {form.formState.errors.acceptedTerms.message as string}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
              {register.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Đăng ký
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
