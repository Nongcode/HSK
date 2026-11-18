import { gradeOrder } from "./grade";
import type { Sentence } from "./schema";

const MAX_TRIES = 50;

/** A permutation of chunk indices that is not an accepted answer (when one exists). */
export function shuffleOrder(s: Sentence, rand: () => number = Math.random): number[] {
  const n = s.chunks.length;
  for (let t = 0; t < MAX_TRIES; t++) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (!gradeOrder(s, order).ok) return order;
  }
  return Array.from({ length: n }, (_, i) => (i + 1) % n);
}
