import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMMENT_MIN = 10;
const COMMENT_MAX = 1000;
const MAX_IMAGES = 3;

const RATING_MEANINGS: Record<number, string> = {
  1: "Rất tệ",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng",
};

export type ReviewFormValues = {
  rating: number;
  comment?: string;
  imageUrls?: string[];
};

export type EligibleOrderOption = {
  orderId: string;
  orderCode: string;
  orderItemId: string;
  completedAt: string;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProductReviewForm({
  mode,
  initialRating,
  initialComment,
  initialImageUrls,
  eligibleOrders,
  selectedOrderItemId,
  onSelectedOrderItemChange,
  submitting,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  mode: "create" | "edit";
  initialRating?: number;
  initialComment?: string;
  initialImageUrls?: string[];
  eligibleOrders?: EligibleOrderOption[];
  selectedOrderItemId?: string;
  onSelectedOrderItemChange?: (orderItemId: string) => void;
  submitting?: boolean;
  onSubmit: (values: ReviewFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls ?? []);
  const [newImage, setNewImage] = useState("");
  const [errors, setErrors] = useState<{ comment?: string; image?: string }>({});

  useEffect(() => {
    if (initialRating !== undefined) setRating(initialRating);
  }, [initialRating]);

  const trimmed = comment.trim();
  const commentTooShort = trimmed.length > 0 && trimmed.length < COMMENT_MIN;
  const commentTooLong = trimmed.length > COMMENT_MAX;
  const canSubmit =
    rating >= 1 && rating <= 5 && !commentTooShort && !commentTooLong && !submitting;

  const displayRating = hoverRating || rating;

  const handleAddImage = () => {
    const v = newImage.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) {
      setErrors((e) => ({ ...e, image: "URL ảnh phải bắt đầu bằng http(s)://" }));
      return;
    }
    if (imageUrls.length >= MAX_IMAGES) {
      setErrors((e) => ({ ...e, image: `Tối đa ${MAX_IMAGES} ảnh` }));
      return;
    }
    setImageUrls([...imageUrls, v]);
    setNewImage("");
    setErrors((e) => ({ ...e, image: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      rating,
      comment: trimmed || undefined,
      imageUrls: imageUrls.length ? imageUrls : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {eligibleOrders && eligibleOrders.length > 1 && selectedOrderItemId && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Đánh giá cho lần mua</label>
          <Select
            value={selectedOrderItemId}
            onValueChange={(v) => onSelectedOrderItemChange?.(v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eligibleOrders.map((o) => (
                <SelectItem key={o.orderItemId} value={o.orderItemId}>
                  Đơn #{o.orderCode} · Hoàn thành ngày {formatDate(o.completedAt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <div className="mb-1 text-sm font-medium">
          Chất lượng món ăn <span className="text-destructive">*</span>
        </div>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
          role="radiogroup"
          aria-label="Chọn số sao"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} sao`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onFocus={() => setHoverRating(n)}
              onBlur={() => setHoverRating(0)}
              className="rounded p-1 outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star
                className={cn(
                  "size-8",
                  n <= displayRating
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-foreground/80">
            {displayRating ? RATING_MEANINGS[displayRating] : "Chọn số sao"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="text-sm font-medium">
          Chia sẻ cảm nhận của bạn về món ăn
        </label>
        <Textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
          placeholder="Món ăn có ngon không, khẩu phần thế nào, đóng gói có cẩn thận không?"
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span
            className={cn(
              commentTooShort && "text-destructive",
              commentTooLong && "text-destructive",
            )}
          >
            {commentTooShort
              ? `Tối thiểu ${COMMENT_MIN} ký tự`
              : commentTooLong
                ? `Tối đa ${COMMENT_MAX} ký tự`
                : "Có thể để trống"}
          </span>
          <span>
            {trimmed.length}/{COMMENT_MAX}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Ảnh (không bắt buộc, tối đa {MAX_IMAGES})
        </label>
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((u, i) => (
              <div key={u + i} className="relative">
                <img
                  src={u}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><rect width='72' height='72' fill='%23eee'/><text x='50%25' y='55%25' text-anchor='middle' fill='%23aaa' font-size='12'>ảnh lỗi</text></svg>";
                  }}
                  className="size-16 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                  aria-label="Xoá ảnh"
                  className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-background shadow-card"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {imageUrls.length < MAX_IMAGES && (
          <div className="flex gap-2">
            <Input
              type="url"
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="Dán URL ảnh (mock)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddImage();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddImage}
              disabled={!newImage.trim()}
            >
              Thêm
            </Button>
          </div>
        )}
        {errors.image && (
          <p className="text-[11px] text-destructive">{errors.image}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Huỷ
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {submitting
            ? "Đang gửi..."
            : (submitLabel ?? (mode === "edit" ? "Lưu thay đổi" : "Gửi đánh giá"))}
        </Button>
      </div>
    </form>
  );
}
