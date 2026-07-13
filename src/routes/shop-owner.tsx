import { createFileRoute } from "@tanstack/react-router";
import { ShopOwnerShell } from "@/components/shop-owner-shell";

export const Route = createFileRoute("/shop-owner")({
  head: () => ({ meta: [{ title: "Đối tác HoLa Market" }] }),
  component: ShopOwnerShell,
});
