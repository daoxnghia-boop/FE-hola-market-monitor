import type { OrderStatus, VoucherStatus } from "./api/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  da_dat: "Đã đặt",
  cho_quan_xac_nhan: "Chờ quán xác nhận",
  quan_da_xac_nhan: "Quán đã xác nhận",
  dang_chuan_bi: "Đang chuẩn bị",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  da_huy: "Đã hủy",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "da_dat",
  "cho_quan_xac_nhan",
  "quan_da_xac_nhan",
  "dang_chuan_bi",
  "dang_giao",
  "hoan_thanh",
];

export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  usable: "Có thể dùng",
  soon_expire: "Sắp hết hạn",
  used: "Đã dùng",
  expired: "Hết hạn",
  locked: "Chưa mở khóa",
  not_eligible: "Chưa đủ điều kiện",
  disabled: "Tạm ngưng",
};

export const formatVND = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
export const formatRelativeTime = (value: string) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
};
