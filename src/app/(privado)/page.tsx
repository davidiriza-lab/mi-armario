import Link from "next/link";
import { Vestir } from "@/components/Vestir";
import { estadoArmario } from "@/lib/armario";
import { hoyISO } from "@/lib/fecha";
import { APP } from "@/contenido/config";

export const dynamic = "force-dynamic";

export default async function VestirPage() {
  const hoy = hoyISO();
  const est = await estadoArmario(hoy);
  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <p className="kicker">{APP.nombre}</p>
          <h1 className="display">Vestir</h1>
        </div>
      </header>
      <div className="acciones">
        <Link href="/armario" className="btn ghost chico">Armario</Link>
        <Link href="/compartir" className="btn ghost chico">Compartir</Link>
      </div>
      {est.prendas.length === 0 ? (
        <div className="tarjeta hundida stack" style={{ gap: ".6rem" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Tu armario está vacío.</p>
          <p className="mini" style={{ margin: 0 }}>Da de alta tus prendas y arma combinaciones en Armario, o carga el ejemplo con npm run cargar -- datos/ejemplo.json para ver cómo funciona.</p>
          <Link href="/armario" className="btn chico" style={{ alignSelf: "flex-start" }}>Ir a Armario</Link>
        </div>
      ) : (
        <Vestir inicial={est} hoy={hoy} />
      )}
    </div>
  );
}
