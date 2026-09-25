import type { Metadata } from "next";
import { Compras } from "@/components/Compras";
import { listarCompras } from "@/lib/compras";

export const metadata: Metadata = { title: "Compras" };
export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const items = await listarCompras();
  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <p className="kicker">Lista</p>
          <h1 className="display">Compras</h1>
        </div>
      </header>
      <Compras inicial={items} />
    </div>
  );
}
