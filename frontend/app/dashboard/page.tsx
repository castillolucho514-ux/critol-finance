"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
      {err && (
        <div style={{ margin: "12px 0" }}>
          <p role="alert" style={{ color: "#b91c1c" }}>{err}</p>
          <p>
            <Link href="/subscription">Gestionar suscripción / Activar plan</Link> | <Link href="/login">Iniciar sesión</Link>
          </p>
        </div>
      )}
      <ul>{Object.entries(pairs).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
    </main>
  );
}
