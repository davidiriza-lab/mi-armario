import type { Metadata } from "next";
import { Vestir } from "@/components/Vestir";
import { validarToken } from "@/lib/enlaces";
import { estadoArmario } from "@/lib/armario";
import { hoyISO } from "@/lib/fecha";
import { APP } from "@/contenido/config";

export const metadata: Metadata = { title: "Vestir", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Liga compartida: Vestir en solo lectura, sin contraseña. */
export default async function Compartido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await validarToken(token))) {
    return (
      <div className="pagina" style={{ paddingBottom: "2rem" }}>
        <p className="kicker">{APP.nombre}</p>
        <h1 className="display" style={{ fontSize: "2rem", margin: ".4rem 0 .8rem" }}>Esta liga ya no sirve.</h1>
        <p className="mini">Pide una liga nueva.</p>
      </div>
    );
  }
  const hoy = hoyISO();
  const est = await estadoArmario(hoy);
  return (
    <div className="pagina" style={{ paddingBottom: "2rem" }}>
      <header className="cabecera">
        <div>
          <p className="kicker">{APP.nombre} · solo lectura</p>
          <h1 className="display">Vestir</h1>
        </div>
      </header>
      <Vestir inicial={est} hoy={hoy} token={token} soloLectura />
    </div>
  );
}
