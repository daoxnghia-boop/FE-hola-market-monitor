import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useRemoveCartItem, useUpdateCartItem } from "@/lib/api/hooks";
import type { CartItemDto } from "@/lib/api/types";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import { toast } from "sonner";

export function CartItem({ item, editable = true }: { item: CartItemDto; editable?: boolean }) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(item.note ?? "");

  return (
    <div className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
      <img
        src={item.product.imageUrl}
        alt={item.product.name}
        className="size-20 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-1 font-semibold">{item.product.name}</h4>
          {editable && (
            <button
              onClick={() =>
                removeItem.mutate(item.id, {
                  onError: (error) => toast.error(apiErrorMessage(error)),
                })
              }
              className="text-muted-foreground hover:text-destructive"
              aria-label="Xóa"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        {!editingNote ? (
          <button
            type="button"
            onClick={() => editable && setEditingNote(true)}
            className="line-clamp-1 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            {item.note ? (
              <>Ghi chú: {item.note}</>
            ) : editable ? (
              <span className="italic">+ Thêm ghi chú cho món</span>
            ) : (
              item.product.description
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ít cay, không hành..."
              className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateItem.mutate(
                    { itemId: item.id, note: note.trim() },
                    { onError: (error) => toast.error(apiErrorMessage(error)) },
                  );
                  setEditingNote(false);
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs"
              onClick={() => {
                updateItem.mutate(
                  { itemId: item.id, note: note.trim() },
                  { onError: (error) => toast.error(apiErrorMessage(error)) },
                );
                setEditingNote(false);
              }}
            >
              Lưu
            </Button>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-bold text-primary">
            {formatVND(item.product.price * item.quantity)}
          </span>
          {editable && (
            <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
                onClick={() =>
                  updateItem.mutate(
                    { itemId: item.id, quantity: item.quantity - 1 },
                    { onError: (error) => toast.error(apiErrorMessage(error)) },
                  )
                }
              >
                <Minus />
              </Button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
                onClick={() =>
                  updateItem.mutate(
                    { itemId: item.id, quantity: item.quantity + 1 },
                    { onError: (error) => toast.error(apiErrorMessage(error)) },
                  )
                }
              >
                <Plus />
              </Button>
            </div>
          )}
          {!editable && (
            <span className="text-sm font-semibold text-muted-foreground">× {item.quantity}</span>
          )}
        </div>
      </div>
    </div>
  );
}
