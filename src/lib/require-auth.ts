import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSession } from "@/lib/api/hooks";
import { storeRedirectIntent } from "@/lib/redirect";

/** Redirects to /login when the session is confirmed unauthenticated. */
export function useRequireAuth() {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (session.isLoading) return;
    if (!session.data?.authenticated) {
      storeRedirectIntent(pathname);
      navigate({ to: "/login", replace: true });
    }
  }, [session.isLoading, session.data, navigate, pathname]);

  return session;
}
