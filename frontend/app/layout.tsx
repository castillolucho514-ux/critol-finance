import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "CristoFinance" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui", maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/subscription">Suscripción</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/licenses">Licencias</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
