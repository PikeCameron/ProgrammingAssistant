const STORAGE_KEY = 'pr-dashboard:mac-review-url-override';

export function getMacReviewUrlOverride(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function setMacReviewUrlOverride(value: string): void {
  const trimmed = value.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
}

// Accepts a bare IP/hostname (port + path filled in) or a full URL.
export function resolveMacReviewUrl(): string | undefined {
  const override = getMacReviewUrlOverride();
  if (!override) return undefined;
  return override.includes('://') ? override : `http://${override}:3002/review`;
}
