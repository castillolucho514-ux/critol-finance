"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const series = {
  es: [{ day: "Lun", value: 182 }, { day: "Mar", value: 185 }, { day: "Mié", value: 183 }, { day: "Jue", value: 188 }, { day: "Vie", value: 190 }],
  en: [{ day: "Mon", value: 182 }, { day: "Tue", value: 185 }, { day: "Wed", value: 183 }, { day: "Thu", value: 188 }, { day: "Fri", value: 190 }]
};
const copy = {
  es: { title: "Tu mercado, con claridad", subtitle: "Cotizaciones y análisis para tomar mejores decisiones.", portfolio: "Cartera", quotes: "Cotizaciones", analysis: "Análisis", settings: "Configuración", marketsOpen: "Mercados abiertos" },
  en: { title: "Your market, made clear", subtitle: "Quotes and analysis for better decisions.", portfolio: "Portfolio", quotes: "Quotes", analysis: "Analysis", settings: "Settings", marketsOpen: "Markets open" }
};

export default function Dashboard() {
  const [locale, setLocale] = useState<"es" | "en">("es");
  const t = copy[locale];
  const data = series[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <main className="mx-auto min-h-screen max-w-6xl p-6">
    <header className="flex items-center justify-between border-b border-slate-800 pb-6">
      <strong className="text-xl text-emerald-400">Critol Finance</strong>
      <button className="rounded bg-slate-800 px-3 py-2" onClick={() => setLocale(locale === "es" ? "en" : "es")}>{locale.toUpperCase()}</button>
    </header>
    <nav className="my-6 flex gap-4 text-sm text-slate-400"><span>Dashboard</span><span>{t.quotes}</span><span>{t.analysis}</span><span>{t.portfolio}</span><span>{t.settings}</span></nav>
    <section className="grid gap-6 md:grid-cols-2">
      <div><p className="text-emerald-400">{t.marketsOpen}</p><h1 className="text-4xl font-bold">{t.title}</h1><p className="mt-3 text-slate-400">{t.subtitle}</p></div>
      <div className="h-56 rounded-xl bg-slate-900 p-4"><ResponsiveContainer><LineChart data={data}><XAxis dataKey="day" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
    </section>
    <section className="mt-8 grid gap-4 sm:grid-cols-3">
      {["AAPL  $189.98  +1.24%", "MSFT  $420.21  -0.34%", "TSLA  $177.81  +2.11%"].map((quote) => <article className="rounded-xl bg-slate-900 p-5" key={quote}>{quote}</article>)}
    </section>
  </main>;
}
