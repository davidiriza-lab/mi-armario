import type { Metadata } from "next";
import { Lavado } from "@/components/Lavado";
import { estadoArmario } from "@/lib/armario";
import { hoyISO } from "@/lib/fecha";

export const metadata: Metadata = { title: "Lavado" };
export const dynamic = "force-dynamic";

export default async function LavadoPage() {
  const hoy = hoyISO();
  const est = await estadoArmario(hoy);
  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <p className="kicker">Cuidado</p>
          <h1 className="display">Lavado</h1>
        </div>
      </header>
      <Lavado inicial={est} hoy={hoy} />
    </div>
  );
}
