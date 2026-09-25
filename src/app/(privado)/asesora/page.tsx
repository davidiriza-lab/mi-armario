import type { Metadata } from "next";
import { Asesora } from "@/components/Asesora";
import { listarMensajes } from "@/lib/asesora";
import { ASESORA } from "@/contenido/asesora";
import { esDemo } from "@/lib/demo";

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
      {esDemo ? (
        <div className="tarjeta hundida stack" style={{ gap: ".5rem" }}>
          <p className="mini" style={{ margin: 0 }}>En la demo la asesora está apagada. En tu versión, con tu llave de la API de Claude, aquí le preguntas qué ponerte, le mandas foto de una prenda en la tienda para saber si combina con lo que tienes, o le pides que te arme la lista de compras. Conoce tu inventario, lo que está limpio cada día y tus reglas de estilo.</p>
          <p className="mini suave" style={{ margin: 0 }}>Ejemplo real: &ldquo;Tengo una comida de trabajo el domingo, ¿qué me pongo de lo que esté limpio?&rdquo; y responde con las combinaciones disponibles ese día, citando tus reglas.</p>
        </div>
      ) : (
        <Asesora inicial={mensajes} nombre={ASESORA.nombre} encendida={!!process.env.ANTHROPIC_API_KEY} />
      )}
    </div>
  );
}
