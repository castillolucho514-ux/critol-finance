"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib";

export default function Subscription() {
  const [plans, setPlans] = useState<Record<string, { priceUsd: number; dailyMessages: number }>>({});
  const [me, setMe] = useState<{ plan: string } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/plans").then(setPlans); api("/me").then(setMe).catch((e) => setErr(e.message)); }, []);
  const choose = (plan: string) => api("/subscription", { method: "PUT", body: JSON.stringify({ plan }) }).then(setMe).catch((e) => setErr(e.message));
  return (
    <main>
      <h1>Suscripción</h1>
      <p>Plan actual: {me?.plan}</p>
      {err && <p role="alert">{err}</p>}
      {Object.entries(plans).map(([k, p]) => (
        <div key={k}><b>{k}</b> ${p.priceUsd}/mo · {p.dailyMessages} msgs/day <button onClick={() => choose(k)}>Select</button></div>
      ))}
    </main>
  );
}
