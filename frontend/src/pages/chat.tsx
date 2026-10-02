import { FormEvent, useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import { t } from "../utils/i18n";
import { useUser } from "../utils/useUser";

interface Msg { role: "user" | "assistant"; content: string }

export default function Chat() {
  const { user, logout } = useUser();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) api<{ messages: Msg[] }>("/api/chat/history").then((r) => setMessages(r.messages)); }, [user]);
  useEffect(() => end.current?.scrollIntoView(), [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput(""); setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const r = await api<{ reply: string }>("/api/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      setMessages((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: (err as Error).message }]);
    } finally { setBusy(false); }
  }

  if (!user) return null;
  return (
    <Layout user={user} logout={logout}>
      <div className="card flex h-[70vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <span className={`inline-block max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left ${m.role === "user" ? "bg-emerald-700" : "bg-slate-800"}`}>{m.content}</span>
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="mt-3 flex gap-2">
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t(user.language, "askAnything")} />
          <button className="btn" disabled={busy}>{t(user.language, "send")}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">{t(user.language, "disclaimer")}</p>
      </div>
    </Layout>
  );
}
