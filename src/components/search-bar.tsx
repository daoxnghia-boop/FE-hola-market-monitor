import { Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  /** When provided, renders as a non-editable Link that navigates on tap. */
  to?: string;
  /** Pre-fill search keyword for query-param navigation. */
  initialQ?: string;
};

export function SearchBar({
  placeholder = "Tìm món, quán quanh bạn...",
  className,
  to,
  initialQ,
  ...props
}: Props) {
  if (to) {
    return (
      <Link
        to={to as never}
        search={initialQ ? ({ q: initialQ } as never) : undefined}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-left text-sm text-muted-foreground shadow-card transition hover:border-primary/40 active:scale-[0.99]",
          className,
        )}
        aria-label="Tìm món, tìm quán"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{placeholder}</span>
      </Link>
    );
  }

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
