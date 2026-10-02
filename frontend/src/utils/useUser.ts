import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";
import type { Lang } from "./i18n";

export interface User {
  id: string; email: string; name: string; role: "USER" | "ADMIN";
  plan: "FREE" | "PRO" | "PREMIUM"; language: Lang; riskProfile: string;
}

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/"); return; }
    api<{ user: User }>("/api/auth/me").then((r) => setUser(r.user)).catch(() => { setToken(null); router.replace("/"); });
  }, [router]);

  const logout = useCallback(() => { setToken(null); router.replace("/"); }, [router]);
  return { user, setUser, logout };
}
