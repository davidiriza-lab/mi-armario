import type { Metadata } from "next";
import { Asesora } from "@/components/Asesora";
import { listarMensajes } from "@/lib/asesora";
import { ASESORA } from "@/contenido/asesora";

export const metadata: Metadata = { title: ASESORA.nombre };
export const dynamic = "force-dynamic";

export default async function AsesoraPage() {
  const mensajes = await listarMensajes();
  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <p className="kicker">Asesora de imagen</p>
          <h1 className="display">{ASESORA.nombre}</h1>
        </div>
      </header>
      <Asesora inicial={mensajes} nombre={ASESORA.nombre} encendida={!!process.env.ANTHROPIC_API_KEY} />
    </div>
  );
}
