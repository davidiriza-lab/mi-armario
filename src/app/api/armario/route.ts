import { NextResponse } from "next/server";
import { autorizado, leerJson, mal, noAutorizado } from "@/lib/guard";
import { activarPrenda, altaOutfit, altaPrenda, diaValido, estadoArmario, lavarCarga, limpiarPrenda, quitarDia, retirarOutfit, usarOutfit } from "@/lib/armario";
import { validarToken } from "@/lib/enlaces";

export const dynamic = "force-dynamic";

/** GET ?fecha=YYYY-MM-DD → estado del armario ese día. Lectura con sesión, secreto de API o liga compartida (header x-armario-liga). */
export async function GET(req: Request) {
  const liga = req.headers.get("x-armario-liga");
  if (!(liga ? await validarToken(liga) : await autorizado(req))) return noAutorizado();
  const dia = diaValido(new URL(req.url).searchParams.get("fecha"));
  if (!dia) return mal("fecha fuera de rango");
  return NextResponse.json(await estadoArmario(dia));
}

type Cuerpo = {
  accion?: "usar" | "quitar" | "lavar_carga" | "activar" | "alta_prenda" | "alta_outfit" | "retirar_outfit";
  fecha?: string;
  outfit?: string;
  carga?: string;
  prendas?: unknown;
  prenda?: unknown;
  activa?: boolean;
  nombre?: string;
  ocasion?: string;
  foto?: string;
};

const listaIds = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length <= 80).slice(0, 60) : []);

/** POST { accion, ... } → devuelve el estado actualizado. Solo con sesión o secreto de API (nunca con liga). */
export async function POST(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  const b = await leerJson<Cuerpo>(req);
  if (!b?.accion) return mal("Falta accion");
  const dia = diaValido(b.fecha);
  if (!dia) return mal("fecha fuera de rango");
  try {
    switch (b.accion) {
      case "usar":
        if (typeof b.outfit !== "string") return mal("Falta outfit");
        await usarOutfit(b.outfit, dia);
        break;
      case "quitar":
        await quitarDia(dia);
        break;
      case "lavar_carga": {
        const carga = b.carga === "A" || b.carga === "B" || b.carga === "C" ? b.carga : null;
        const prendas = listaIds(b.prendas);
        if (!carga || prendas.length === 0) return mal("Falta carga o prendas");
        await lavarCarga(carga, prendas, dia);
        break;
      }
      case "activar":
        if (typeof b.prenda !== "string" || typeof b.activa !== "boolean") return mal("Falta prenda o activa");
        await activarPrenda(b.prenda, b.activa);
        break;
      case "alta_prenda": {
        const p = limpiarPrenda(b.prenda);
        if (!p) return mal("Prenda inválida: necesita nombre y tipo (top, capa, pant o zapato)");
        const id = await altaPrenda(p);
        return NextResponse.json({ ...(await estadoArmario(dia)), creado: id });
      }
      case "alta_outfit": {
        const id = await altaOutfit({ nombre: String(b.nombre ?? ""), prendas: listaIds(b.prendas), ocasion: typeof b.ocasion === "string" ? b.ocasion.slice(0, 40) : null, foto: typeof b.foto === "string" && b.foto.trim() ? b.foto.trim().slice(0, 500) : null });
        return NextResponse.json({ ...(await estadoArmario(dia)), creado: id });
      }
      case "retirar_outfit":
        if (typeof b.outfit !== "string") return mal("Falta outfit");
        await retirarOutfit(b.outfit);
        break;
      default:
        return mal("Acción desconocida");
    }
  } catch (e) {
    return mal(e instanceof Error ? e.message : "Error");
  }
  return NextResponse.json(await estadoArmario(dia));
}
