const dialogStack = [];
const backgroundSelectors = [".app-shell", "#saveNotice"];

export function activateDialogFocus(dialog, trigger = document.activeElement) {
  if (!(dialog instanceof HTMLElement)) return;
  const current = dialogStack.at(-1);
  if (current?.dialog === dialog) return;
  if (current?.dialog) current.dialog.inert = true;
  if (!dialogStack.length) setBackgroundInert(true);
  dialogStack.push({ dialog, trigger: trigger instanceof HTMLElement ? trigger : null });
  dialog.inert = false;
}

export function deactivateDialogFocus(dialog) {
  const index = dialogStack.findLastIndex((entry) => entry.dialog === dialog);
  if (index < 0) return;
  const [{ trigger }] = dialogStack.splice(index, 1);
  dialog.inert = false;
  const current = dialogStack.at(-1);
  if (current?.dialog) current.dialog.inert = false;
  else setBackgroundInert(false);
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
}

export function trapDialogFocus(event) {
  if (event.key !== "Tab") return false;
  const current = dialogStack.at(-1)?.dialog;
  if (!current) return false;
  const focusable = getFocusableElements(current);
  if (!focusable.length) {
    event.preventDefault();
    current.focus();
    return true;
  }
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!current.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

export function setAuthPageInert(inert) {
  setBackgroundInert(Boolean(inert));
}

function getFocusableElements(root) {
  return Array.from(root.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hidden && element.getClientRects().length > 0);
}

function setBackgroundInert(inert) {
  backgroundSelectors.forEach((selector) => {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) element.inert = inert;
  });
}
