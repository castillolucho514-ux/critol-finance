import Link from "next/link";
import type { ReactNode } from "react";
import { t } from "../utils/i18n";
import type { User } from "../utils/useUser";

export default function Layout({ user, logout, children }: { user: User; logout: () => void; children: ReactNode }) {
  const lang = user.language;
  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <nav className="flex gap-4">
          <span className="font-bold text-emerald-400">CristoFinance</span>
          <Link href="/dashboard">{t(lang, "dashboard")}</Link>
          <Link href="/chat">{t(lang, "chat")}</Link>
          <Link href="/settings">{t(lang, "settings")}</Link>
          {user.role === "ADMIN" && <Link href="/admin">{t(lang, "admin")}</Link>}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded bg-slate-800 px-2 py-1">{user.plan}</span>
          <button onClick={logout}>{t(lang, "logout")}</button>
        </div>
      </header>
      {children}
    </div>
  );
}
