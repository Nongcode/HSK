/** True when a key press landed on a control that owns Enter itself (link, button, form field). */
export function isFocusedControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("a, button, input, select, textarea") !== null;
}
