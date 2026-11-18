"use client";

import { useApp } from "@/lib/app-context";

export function EphemeralBanner() {
  const { isEphemeral } = useApp();
  if (!isEphemeral) return null;
  return (
    <p role="status" className="border-b border-line bg-surface px-4 py-2 text-sm text-warn">
      Trình duyệt không lưu được tiến độ (có thể đang ở chế độ riêng tư). Bạn vẫn học được, nhưng
      tiến độ sẽ mất khi đóng tab. Hãy xuất sao lưu trong Cài đặt nếu cần.
    </p>
  );
}
