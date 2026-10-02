"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib";

type Msg = { role: string; content: string };

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { api("/chat").then(setMsgs).catch((e) => setErr(e.message)); }, []);
  const send = async () => {
    const message = text;
    setText(""); setErr("");
    setMsgs((m) => [...m, { role: "user", content: message }]);
    try {
      const r = await api("/chat", { method: "POST", body: JSON.stringify({ message }) });
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <main>
      <h1>Chat IA</h1>
      {msgs.map((m, i) => <p key={i}><b>{m.role}:</b> {m.content}</p>)}
      {err && <p role="alert">{err}</p>}
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </main>
  );
}
