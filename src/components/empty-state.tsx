import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card p-10 text-center shadow-card">
      <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
        {icon ?? <ShoppingBag className="size-6" />}
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
