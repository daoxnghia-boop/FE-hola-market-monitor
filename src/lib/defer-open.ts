/**
 * Defer opening a Dialog/AlertDialog triggered from a Radix DropdownMenu/Select item.
 *
 * Reason: Radix DropdownMenu's `onSelect` fires *before* the menu unmounts and
 * restores focus to its trigger. If we open a Dialog synchronously inside
 * `onSelect`, the Dialog's autofocus races with the DropdownMenu's focus
 * restore, and focus can end up on `document.body` — breaking keyboard
 * navigation for subsequent Tab/Escape presses. Deferring the state update
 * to the next microtask lets the DropdownMenu close cleanly first, then
 * Dialog mounts and traps focus normally.
 */
export function deferOpen(fn: () => void) {
  if (typeof window === "undefined") {
    fn();
    return;
  }
  window.setTimeout(fn, 0);
}
