import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Enlaces } from "@/components/Enlaces";
import { listarEnlaces } from "@/lib/enlaces";

export const metadata: Metadata = { title: "Compartir" };
export const dynamic = "force-dynamic";

export default async function CompartirPage() {
  const [enlaces, h] = await Promise.all([listarEnlaces(), headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <p className="kicker">Solo lectura</p>
          <h1 className="display">Compartir</h1>
        </div>
      </header>
      <div className="acciones">
        <Link href="/" className="btn ghost chico">Vestir</Link>
      </div>
      <Enlaces inicial={enlaces} origen={`${proto}://${host}`} />
    </div>
  );
}
