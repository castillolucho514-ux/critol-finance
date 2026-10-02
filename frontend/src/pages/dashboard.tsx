import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import { t } from "../utils/i18n";
import { useUser } from "../utils/useUser";

export default function Dashboard() {
  const { user, logout } = useUser();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [newSymbol, setNewSymbol] = useState("");
  const [selected, setSelected] = useState("BTC");
  const [series, setSeries] = useState<{ day: string; close: number }[]>([]);
  const [portfolio, setPortfolio] = useState<{ holdings: { currency: string; balance: number; value: number }[]; totalUsd: number } | null>(null);

  const loadWatchlist = useCallback(async () => {
    const { symbols } = await api<{ symbols: string[] }>("/api/market/watchlist");
    setSymbols(symbols);
    const entries = await Promise.all(symbols.map(async (s) => [s, (await api<{ usd: number }>(`/api/market/price/${s}`).catch(() => ({ usd: NaN }))).usd] as const));
    setPrices(Object.fromEntries(entries));
  }, []);

  useEffect(() => { if (user) loadWatchlist(); }, [user, loadWatchlist]);
  useEffect(() => {
    if (!user || user.plan === "FREE") return;
    api(`/api/market/analysis/${selected}`).then((r) => setSeries(r.candles.map((c: any) => ({ day: new Date(c.time * 1000).toLocaleDateString(), close: c.close })))).catch(() => setSeries([]));
    api("/api/market/portfolio").then(setPortfolio).catch(() => setPortfolio(null));
  }, [user, selected]);

  if (!user) return null;
  return (
    <Layout user={user} logout={logout}>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 font-semibold">{t(user.language, "watchlist")}</h2>
          <form className="mb-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!newSymbol) return; await api("/api/market/watchlist", { method: "POST", body: JSON.stringify({ symbol: newSymbol }) }); setNewSymbol(""); loadWatchlist(); }}>
            <input className="input" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} placeholder="BTC" />
            <button className="btn">{t(user.language, "add")}</button>
          </form>
          <ul className="space-y-1">
            {symbols.map((s) => (
              <li key={s} className="flex justify-between">
                <button onClick={() => setSelected(s)}>{s}</button>
                <span>${Number.isNaN(prices[s]) ? "—" : prices[s]?.toLocaleString()}</span>
                <button className="text-red-400" onClick={async () => { await api(`/api/market/watchlist/${s}`, { method: "DELETE" }); loadWatchlist(); }}>×</button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="mb-2 font-semibold">{t(user.language, "portfolio")}</h2>
          {user.plan === "FREE" ? <p className="text-slate-400">{t(user.language, "upgrade")}</p> : portfolio ? (
            <>
              <p className="text-2xl">${portfolio.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <ul>{portfolio.holdings.map((h) => <li key={h.currency}>{h.currency}: {h.balance} (${h.value.toFixed(2)})</li>)}</ul>
            </>
          ) : <p className="text-slate-400">Coinbase not connected</p>}
        </section>
        <section className="card md:col-span-2">
          <h2 className="mb-2 font-semibold">{selected} — {t(user.language, "trend")}</h2>
          {user.plan === "FREE" ? <p className="text-slate-400">{t(user.language, "upgrade")}</p> : (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid stroke="#334155" /><XAxis dataKey="day" stroke="#94a3b8" /><YAxis domain={["auto", "auto"]} stroke="#94a3b8" /><Tooltip />
                  <Line dataKey="close" stroke="#10b981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
