import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  placeholder = "Tìm món, quán quanh bạn...",
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 shadow-card focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </label>
  );
}
