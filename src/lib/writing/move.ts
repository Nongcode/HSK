/** Moves the item at `from` so it ends up at index `to`; invalid or no-op moves return the same array. */
export function moveChunk(placed: number[], from: number, to: number): number[] {
  const last = placed.length - 1;
  if (from === to || from < 0 || to < 0 || from > last || to > last) return placed;
  const next = [...placed];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
