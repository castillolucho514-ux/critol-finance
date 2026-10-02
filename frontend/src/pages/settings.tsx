import { useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import { t } from "../utils/i18n";
import { useUser } from "../utils/useUser";

export default function Settings() {
  const { user, setUser, logout } = useUser();
  const [error, setError] = useState("");
  if (!user) return null;

  const update = async (data: Record<string, string>) => setUser((await api("/api/auth/me", { method: "PATCH", body: JSON.stringify(data) })).user);
  const upgrade = async (plan: "PRO" | "PREMIUM") => {
    try { window.location.href = (await api<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan }) })).url; }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <Layout user={user} logout={logout}>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <label className="block">{t(user.language, "language")}
            <select className="input" value={user.language} onChange={(e) => update({ language: e.target.value })}><option value="es">Español</option><option value="en">English</option></select>
          </label>
          <label className="block">{t(user.language, "risk")}
            <select className="input" value={user.riskProfile} onChange={(e) => update({ riskProfile: e.target.value })}>
              <option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="aggressive">Aggressive</option>
            </select>
          </label>
        </section>
        <section className="card space-y-2">
          <h2 className="font-semibold">{t(user.language, "plan")}: {user.plan}</h2>
          <p className="text-sm text-slate-400">Free: 10 chats/day · Pro $19: unlimited chat, analysis, Coinbase · Premium $49: + trading automation</p>
          <div className="flex gap-2"><button className="btn" onClick={() => upgrade("PRO")}>Pro</button><button className="btn" onClick={() => upgrade("PREMIUM")}>Premium</button></div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>
      </div>
    </Layout>
  );
}
