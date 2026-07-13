import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProductReview } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const MAX_COMMENT = 500;

export function WriteProductReviewDialog({
  open,
  onOpenChange,
  orderId,
  productId,
  productName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const mutation = useCreateProductReview();

  const submit = () => {
    mutation.mutate(
      { orderId, productId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Cảm ơn bạn đã đánh giá!", { description: productName });
          onOpenChange(false);
          setRating(5);
          setComment("");
          onSuccess?.();
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setRating(5);
          setComment("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh giá món</DialogTitle>
          <DialogDescription>
            Chia sẻ trải nghiệm với món{" "}
            <span className="font-semibold text-foreground">{productName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} sao`}
                className="p-1 transition hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-9",
                    n <= rating
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nội dung (tuỳ chọn)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
              rows={4}
              placeholder="Cảm nhận về hương vị, chất lượng, thời gian giao..."
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {comment.length}/{MAX_COMMENT}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Huỷ
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
