import type { Metadata } from "next";
import Link from "next/link";
import { Armario } from "@/components/Armario";
import { estadoArmario } from "@/lib/armario";
import { hoyISO } from "@/lib/fecha";

export const metadata: Metadata = { title: "Armario" };
export const dynamic = "force-dynamic";

export default async function ArmarioPage() {
  const hoy = hoyISO();
  const est = await estadoArmario(hoy);
  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <p className="kicker">Inventario</p>
          <h1 className="display">Armario</h1>
        </div>
      </header>
      <div className="acciones">
        <Link href="/" className="btn ghost chico">Vestir</Link>
      </div>
      <Armario inicial={est} hoy={hoy} />
    </div>
  );
}
