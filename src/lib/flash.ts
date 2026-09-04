export const FLASH_EVENT = "taskgen:flash";
export const FLASH_KEY = "taskgen_flash";
export const FLASH_DURATION_MS = 6000;

export function showSuccessFlash(message: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    FLASH_KEY,
    JSON.stringify({ message, at: Date.now() })
  );
  window.dispatchEvent(new CustomEvent(FLASH_EVENT, { detail: message }));
}

export function clearSuccessFlash() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(FLASH_KEY);
}