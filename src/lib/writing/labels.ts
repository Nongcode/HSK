import type { ErrorTag } from "@/lib/storage/types";

export const TAG_LABEL: Record<ErrorTag, string> = {
  "adverbial-before-verb": "Trạng ngữ đứng trước động từ",
  "ba-position": "Vị trí của 把",
  "bei-position": "Vị trí của 被",
  "shi-de": "Cấu trúc 是…的",
  "result-complement": "Bổ ngữ kết quả",
  "attributive-order": "Trật tự định ngữ",
  "time-place-order": "Trật tự thời gian, địa điểm",
  other: "Lỗi khác",
};
