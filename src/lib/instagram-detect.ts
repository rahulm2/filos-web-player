export function isInstagramWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Instagram/i.test(navigator.userAgent);
}

export function getCurrentUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}
