export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const r = await fetch(API + path, {
    ...init,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `error ${r.status}`);
  return j;
}
