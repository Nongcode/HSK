import type { CardState, Grade } from "@/lib/storage/types";

const DAY_MS = 86_400_000;
const AGAIN_DELAY_MS = 10 * 60_000;
const MIN_EASE = 1.3;

export function newCard(id: string, now: number): CardState {
  return { id, ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: now };
}

export function schedule(state: CardState, grade: Grade, now: number): CardState {
  if (grade === "again") {
    return {
      ...state,
      reps: 0,
      lapses: state.lapses + 1,
      intervalDays: 0,
      ease: Math.max(MIN_EASE, state.ease - 0.2),
      due: now + AGAIN_DELAY_MS,
    };
  }

  let intervalDays: number;
  let ease = state.ease;
  if (grade === "hard") {
    intervalDays = Math.max(1, Math.round(state.intervalDays * 1.2));
    ease = Math.max(MIN_EASE, ease - 0.15);
  } else if (grade === "easy") {
    intervalDays = state.reps === 0 ? 4 : Math.round(state.intervalDays * state.ease * 1.3);
    ease += 0.15;
  } else {
    intervalDays =
      state.reps === 0 ? 1 : state.reps === 1 ? 6 : Math.round(state.intervalDays * state.ease);
  }

  return {
    ...state,
    reps: state.reps + 1,
    intervalDays,
    ease,
    due: now + intervalDays * DAY_MS,
  };
}
