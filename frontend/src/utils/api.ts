const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));
export const setToken = (t: string | null) => (t ? localStorage.setItem("token", t) : localStorage.removeItem("token"));

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Request failed");
  return body as T;
}
