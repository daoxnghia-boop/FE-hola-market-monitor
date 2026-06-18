import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CategoryTabs({
  value,
  onChange,
  variant = "icons",
}: {
  value?: string;
  onChange?: (v: string) => void;
  variant?: "icons" | "pills";
}) {
  if (variant === "pills") {
    return (
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: "all", name: "Tất cả", icon: "🍽️" }, ...categories].map((c) => {
          const active = (value ?? "all") === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange?.(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40",
              )}
            >
              <span className="mr-1">{c.icon}</span>
              {c.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange?.(c.id)}
          className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-2xl shadow-card transition hover:scale-105">
            {c.icon}
          </span>
          <span className="line-clamp-1 text-xs font-medium">{c.name}</span>
        </button>
      ))}
    </div>
  );
}
