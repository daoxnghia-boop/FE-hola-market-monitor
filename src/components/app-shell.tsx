import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";

export function AppShell({
  children,
  hideBottomNav = false,
}: {
  children: ReactNode;
  hideBottomNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />
      <main className="mx-auto max-w-6xl">{children}</main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
