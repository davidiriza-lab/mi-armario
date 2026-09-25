import { db } from "./db";
import { hoyISO, sumarDias } from "./fecha";
import { altaOutfit, altaPrenda, limpiarPrenda } from "./armario";
import { altaCompra, type AltaCompra } from "./compras";
import ejemplo from "../../datos/ejemplo.json";

/**
 * Modo demo (ARMARIO_DEMO=1): la contraseña se muestra en la entrada y los datos se
 * reinician solos una vez al día con el armario de ejemplo y unos días de historial.
 * En tu propia versión NO actives este modo: borra todo lo que hay en la base.
 */
export const esDemo = process.env.ARMARIO_DEMO === "1";

/** Contraseña que se muestra en la pantalla de entrada, solo en modo demo. */
export function passwordDemo(): string | null {
  return esDemo ? (process.env.ARMARIO_PASSWORD ?? "").trim() || null : null;
}

type Ejemplo = { prendas: unknown[]; outfits: { id: string; nombre: string; prendas: string[]; ocasion?: string }[]; compras: AltaCompra[] };

const TABLAS = ["armario_usos", "armario_lavados", "armario_mensajes", "armario_enlaces", "armario_compras", "armario_outfits", "armario_prendas"] as const;

async function reiniciar(): Promise<void> {
  for (const t of TABLAS) {
    const { error } = await db().from(t).delete().not("id", "is", null);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
  const datos = ejemplo as Ejemplo;
  for (const bruto of datos.prendas) {
    const p = limpiarPrenda(bruto);
    if (p) await altaPrenda(p, (bruto as { id: string }).id);
  }
  for (const o of datos.outfits) await altaOutfit({ id: o.id, nombre: o.nombre, prendas: o.prendas, ocasion: o.ocasion ?? null });
  for (const c of datos.compras) await altaCompra(c);

  // Historial de muestra que respeta las reglas: tres días usados y una carga lavada.
  const hoy = hoyISO();
  const porId = new Map(datos.outfits.map((o) => [o.id, o.prendas]));
  const dias: [string, string][] = [
    [sumarDias(hoy, -3), "05"],
    [sumarDias(hoy, -2), "01"],
    [sumarDias(hoy, -1), "06"],
  ];
  let primerUso = 0;
  for (const [fecha, outfit] of dias) {
    const { data, error } = await db().from("armario_usos").insert({ fecha, outfit_id: outfit, prendas: porId.get(outfit) ?? [] }).select("id").single();
    if (error) throw new Error(`armario_usos: ${error.message}`);
    if (!primerUso) primerUso = (data as { id: number }).id;
  }
  const { error } = await db().from("armario_lavados").insert({ fecha: sumarDias(hoy, -2), carga: "A", prendas: ["polo-marino"], hasta_uso_id: primerUso });
  if (error) throw new Error(`armario_lavados: ${error.message}`);
}

let revisadoEl: string | null = null;
let enCurso: Promise<void> | null = null;

/**
 * Reinicia la demo si sus datos no son de hoy. Una consulta por instancia al día, y nunca
 * dos reinicios a la vez. Lo llaman las funciones que leen datos (estadoArmario, listarCompras…).
 */
export async function asegurarDemoDelDia(): Promise<void> {
  if (!esDemo) return;
  const hoy = hoyISO();
  if (revisadoEl === hoy) return;
  if (!enCurso) {
    enCurso = (async () => {
      const { data } = await db().from("armario_prendas").select("creado").order("creado").limit(1).maybeSingle();
      const creado = (data as { creado: string } | null)?.creado;
      if (!creado || hoyISO(new Date(creado)) !== hoy) await reiniciar();
      revisadoEl = hoy;
    })().finally(() => {
      enCurso = null;
    });
  }
  await enCurso;
}
