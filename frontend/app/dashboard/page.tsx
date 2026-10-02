"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib";

export default function Dashboard() {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  useEffect(() => {
    Promise.all(["BTC-USD", "ETH-USD"].map((p) => api(`/market/${p}`)))
      .then((r) => setPairs(Object.fromEntries(r.map((x) => [x.pair, `${x.amount} ${x.currency}`]))))
      .catch((e) => setErr(e.message));
  }, []);
  return (
    <main>
      <h1>Dashboard</h1>
      {err && <p role="alert">{err}</p>}
      <ul>{Object.entries(pairs).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
    </main>
  );
}
