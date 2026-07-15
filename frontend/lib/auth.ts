const TOKEN_KEY = "lead_mgmt_token";

// sessionStorage (not localStorage) so the session ends the moment the tab closes.
// Also mirrored into a session cookie (no max-age) for middleware.ts, which runs on
// the edge and can't see sessionStorage; a cookie with no max-age/expires is a
// "session cookie" that the browser drops when it fully closes.
export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; samesite=lax`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}
