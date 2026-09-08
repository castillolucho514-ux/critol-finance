import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Critol Finance",
  description: "Bilingual market intelligence for every investor",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><Providers>{children}</Providers></body></html>;
}
