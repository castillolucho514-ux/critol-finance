import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { api, setToken } from "../utils/api";
import { Lang, t } from "../utils/i18n";

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("es");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const body = mode === "login" ? { email: form.email, password: form.password } : { ...form, language: lang };
      const r = await api<{ token: string }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      setToken(r.token);
      router.push("/dashboard");
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <main className="mx-auto mt-24 max-w-sm">
      <h1 className="mb-6 text-3xl font-bold text-emerald-400">CristoFinance</h1>
      <form onSubmit={submit} className="card space-y-3">
        {mode === "register" && <input className="input" placeholder={t(lang, "name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        <input className="input" type="email" placeholder={t(lang, "email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" type="password" minLength={8} placeholder={t(lang, "password")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn w-full">{t(lang, mode)}</button>
        <div className="flex justify-between text-sm text-slate-400">
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{t(lang, mode === "login" ? "register" : "login")}</button>
          <button type="button" onClick={() => setLang(lang === "es" ? "en" : "es")}>{lang === "es" ? "EN" : "ES"}</button>
        </div>
      </form>
    </main>
  );
}
