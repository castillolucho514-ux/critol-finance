"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib";

export default function Settings() {
  const [me, setMe] = useState<{ email: string; plan: string } | null>(null);
  useEffect(() => { api("/me").then(setMe).catch(() => {}); }, []);
  return (
    <main>
      <h1>Settings</h1>
      <p>{me?.email} ({me?.plan})</p>
      <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>Logout</button>
    </main>
  );
}
