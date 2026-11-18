import type { ReviewLog } from "@/lib/storage/types";

const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Consecutive local days with at least one review. Today may still be empty without breaking it. */
export function streakDays(reviews: ReviewLog[], now: number): number {
  const days = new Set(reviews.map((r) => dayKey(r.at)));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
