import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRequestOtp, useVerifyOtp, useSession } from "@/lib/api/hooks";
import { isMockEnabled } from "@/lib/api/mock";
import { consumeRedirectIntent, safeInternalPath } from "@/lib/redirect";
import { apiErrorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — HoLa Market" }] }),
  component: LoginPage,
});

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, "Số điện thoại phải gồm 10 số, bắt đầu bằng 0"),
});

type Step = "phone" | "otp";

function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const session = useSession();
  const navigate = useNavigate();

  // Already signed in? bounce
  useEffect(() => {
    if (session.data?.authenticated && session.data.user) {
      const dest = session.data.user.role === "admin" ? "/admin" : (consumeRedirectIntent() ?? "/");
      navigate({ to: dest as never, replace: true });
    }
  }, [session.data, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  const phoneForm = useForm({ resolver: zodResolver(phoneSchema), defaultValues: { phone: "" } });

  const requestChallenge = async (p: string) => {
    try {
      const r = await requestOtp.mutateAsync(p);
      setChallengeId(r.challengeId);
      setDevOtp(r.developmentOtp);
      setCountdown(r.expiresInSeconds);
      setStep("otp");
      setOtpValue("");
      toast.success("Đã gửi mã xác thực.");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const submitPhone = phoneForm.handleSubmit(async ({ phone: p }) => {
    setPhone(p);
    await requestChallenge(p);
  });

  const submitOtp = async () => {
    if (otpValue.length !== 6) return;
    try {
      const r = await verifyOtp.mutateAsync({ challengeId, phone, otp: otpValue });
      if (r.status === "requires_registration") {
        toast.info("Số điện thoại chưa có tài khoản. Vui lòng đăng ký.");
        navigate({ to: "/register", search: { phone } as never });
        return;
      }
      toast.success("Đăng nhập thành công!");
      const user = r.session?.user;
      if (user?.role === "admin") {
        navigate({ to: "/admin", replace: true });
      } else {
        const dest = safeInternalPath(consumeRedirectIntent() ?? "/");
        navigate({ to: dest as never, replace: true });
      }
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Về trang chủ
        </Link>

        <div className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-2xl text-primary-foreground">🍜</span>
            <div>
              <div className="text-lg font-extrabold">HoLa Market</div>
              <div className="text-xs text-muted-foreground">Đặt món local quanh Hòa Lạc</div>
            </div>
          </div>

          {step === "phone" ? (
            <form onSubmit={submitPhone} className="space-y-4">
              <h1 className="text-xl font-bold">Đăng nhập</h1>
              <p className="text-sm text-muted-foreground">Nhập số điện thoại để nhận mã xác thực.</p>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone" inputMode="tel" placeholder="0912xxxxxx"
                  autoFocus
                  {...phoneForm.register("phone")}
                />
                {phoneForm.formState.errors.phone && (
                  <p className="text-xs text-destructive">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={requestOtp.isPending}>
                {requestOtp.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Tiếp tục
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">Nhập mã xác thực</h1>
              <p className="text-sm text-muted-foreground">
                Mã 6 số đã gửi tới{" "}
                <span className="font-semibold text-foreground">{phone}</span>{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => setStep("phone")}
                  type="button"
                >
                  (đổi số)
                </button>
              </p>
              {devOtp && isMockEnabled() && (
                <div className="rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
                  💡 Mock OTP: <span className="font-mono font-bold">{devOtp}</span>
                </div>
              )}
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={submitOtp} size="lg" className="w-full"
                disabled={verifyOtp.isPending || otpValue.length !== 6}
              >
                {verifyOtp.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Xác nhận
              </Button>
              <div className="text-center text-sm">
                {countdown > 0 ? (
                  <span className="text-muted-foreground">Gửi lại sau {countdown}s</span>
                ) : (
                  <button
                    type="button" className="font-semibold text-primary hover:underline"
                    onClick={() => requestChallenge(phone)}
                    disabled={requestOtp.isPending}
                  >
                    Gửi lại mã
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {isMockEnabled() && step === "phone" && (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
            <div className="mb-2 font-semibold text-foreground">Tài khoản mock để test</div>
            <ul className="space-y-1">
              <li>👤 Khách: <span className="font-mono">0900000000</span></li>
              <li>🛡️ Admin: <span className="font-mono">0909999999</span></li>
              <li>🔒 Bị khóa: <span className="font-mono">0901111111</span></li>
            </ul>
            <div className="mt-2">Mã OTP dev: <span className="font-mono">123456</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
