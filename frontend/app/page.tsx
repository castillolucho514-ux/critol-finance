import Link from "next/link";
export default function Home() {
  return (
    <main>
      <h1>CristoFinance</h1>
      <p>Asistente financiero con IA / AI financial assistant.</p>
      <div style={{ margin: "16px 0", padding: "12px", border: "1px solid #10b981", borderRadius: 8, background: "#ecfdf5", color: "#065f46" }}>
        <strong>Estado del servicio:</strong> En línea (Activo)
      </div>
      <Link href="/login">Entrar / Sign in</Link>
    </main>
  );
}
