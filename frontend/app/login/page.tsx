"use client";
import { useState } from "react";
import { api } from "../../lib";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const go = async (mode: "login" | "register") => {
    try {
      const r = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", r.token);
      window.location.href = "/dashboard";
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <main>
      <h1>Login</h1>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={() => go("login")}>Login</button>
      <button onClick={() => go("register")}>Register</button>
      {err && <p role="alert">{err}</p>}
    </main>
  );
}
