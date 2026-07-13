import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Confirmation dialog used when adding an item conflicts with the current cart
 * (a different shop). Fully replaces the previous window.confirm() flow.
 */
export function CartConflictDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  productName?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Thay giỏ hàng hiện tại?</AlertDialogTitle>
          <AlertDialogDescription>
            Giỏ của bạn đang có món từ một quán khác. Thêm
            {productName ? ` "${productName}" ` : " món này "}
            sẽ xoá giỏ hiện tại và bắt đầu đơn mới từ quán tương ứng.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Giữ giỏ hiện tại</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Thay giỏ mới</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
