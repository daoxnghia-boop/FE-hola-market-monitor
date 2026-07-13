import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type Aspect = "square" | "4/3" | "video";

const ASPECT_CLASS: Record<Aspect, string> = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
  video: "aspect-video",
};

export function ProductImage({
  src,
  alt,
  aspect = "4/3",
  overlayLabel,
  className,
  imageClassName,
  rounded = "rounded-2xl",
  loading = "lazy",
}: {
  src: string | undefined;
  alt: string;
  aspect?: Aspect;
  overlayLabel?: string;
  className?: string;
  imageClassName?: string;
  rounded?: string;
  loading?: "lazy" | "eager";
}) {
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        ASPECT_CLASS[aspect],
        rounded,
        className,
      )}
    >
      {showFallback ? (
        <div className="grid size-full place-items-center text-muted-foreground">
          <UtensilsCrossed className="size-10 opacity-60" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setErrored(true)}
          className={cn("size-full object-cover", imageClassName)}
        />
      )}
      {overlayLabel && (
        <div className="absolute inset-0 grid place-items-center bg-foreground/60 px-2 text-center text-sm font-semibold text-background">
          {overlayLabel}
        </div>
      )}
    </div>
  );
}
