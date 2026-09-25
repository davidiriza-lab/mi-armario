import { db } from "./db";
import { hoyISO, sumarDias } from "./fecha";
import { REGLAS_USO, vidaLavadas, type TipoPrenda } from "@/contenido/config";
import type { Carga } from "@/contenido/lavado";
import { evaluarPrenda } from "./reglas";

export { cargaDe, evaluarPrenda, luminosidad } from "./reglas";

export type { TipoPrenda } from "@/contenido/config";
export type { Carga } from "@/contenido/lavado";

export type Prenda = {
  id: string;
  nombre: string;
  tipo: TipoPrenda;
  usos_max: number;
  color: string | null;
  tienda: string | null;
  foto: string | null;
  activa: boolean;
  orden: number;
  ref: string | null;
  talla: string | null;
  composicion: string | null;
  /** Instrucciones de cuidado de la etiqueta o la ficha de la tienda. */
  cuidado: string | null;
  /** No va a lavadora: solo limpieza en seco. */
  tintoreria: boolean;
};

export type Outfit = {
  id: string;
  nombre: string;
  prendas: string[];
  /** Foto del outfit puesto (URL pública o ruta en /public). */
  foto: string | null;
  /** Collage de las prendas (opcional). */
  collage: string | null;
  ocasion: string | null;
  activo: boolean;
  orden: number;
};

export type Uso = { id: number; fecha: string; outfit_id: string | null; prendas: string[] };

export type Lavado = { id: number; fecha: string; carga: Carga; prendas: string[]; hasta_uso_id: number };

export type EstadoPrenda = {
  prenda: Prenda;
  usos: number;
  disponible: boolean;
  /** Por qué no está disponible ese día. */
  motivo: string | null;
  fechas: string[];
  /** Días distintos en que se lavó (según las cargas registradas en la app). */
  lavadas: number;
  /** Lavadas que se espera que aguante; null si no aplica. */
  vida: number | null;
};

export type EstadoOutfit = {
  outfit: Outfit;
  disponible: boolean;
  motivo: string | null;
  esHoy: boolean;
  /** Días distintos en que se usó, en todo el historial. */
  veces: number;
  ultimo: string | null;
};

export type EstadoArmario = {
  hoy: string;
  ultimoLavado: string | null;
  prendas: EstadoPrenda[];
  outfits: EstadoOutfit[];
  usoHoy: Uso | null;
  /** Usos de 14 días atrás a 13 adelante (lo que ves en "Este ciclo"). */
  historial: Uso[];
  lavados: Lavado[];
};

/** Días hacia atrás que se pueden corregir y hacia adelante que se pueden programar. */
export const DIAS_ATRAS = 14;
export const DIAS_ADELANTE = 13;
/** Ventana de usos que se leen para calcular qué está sucio. Una prenda sin lavar más tiempo que esto se cuenta limpia. */
const VENTANA_DIAS = 200;

/** Un uso cuenta contra una prenda si es posterior a su último lavado. */
function usoCuenta(u: Uso, lav: Lavado | undefined): boolean {
  if (!lav) return true;
  // Lo del mismo día del lavado (lo que traías puesto) y lo posterior siguen contando.
  return u.id > lav.hasta_uso_id || u.fecha >= lav.fecha;
}

function falla(ctx: string, e: { message: string } | null): never {
  throw new Error(`${ctx}: ${e?.message ?? "error desconocido"}`);
}

export async function estadoArmario(dia: string = hoyISO()): Promise<EstadoArmario> {
  const hoy = hoyISO();
  const desde = sumarDias(dia < hoy ? dia : hoy, -VENTANA_DIAS);
  const [pr, of, us, lv, todos] = await Promise.all([
    db().from("armario_prendas").select("*").order("orden").order("nombre"),
    db().from("armario_outfits").select("*").eq("activo", true).order("orden").order("id"),
    db().from("armario_usos").select("id,fecha,outfit_id,prendas").gte("fecha", desde).order("fecha").order("id").limit(5000),
    db().from("armario_lavados").select("id,fecha,carga,prendas,hasta_uso_id").order("id", { ascending: false }).limit(2000),
    db().from("armario_usos").select("fecha,outfit_id").lte("fecha", hoy).limit(20000),
  ]);
  if (pr.error) falla("armario_prendas", pr.error);
  if (of.error) falla("armario_outfits", of.error);
  if (us.error) falla("armario_usos", us.error);
  if (lv.error) falla("armario_lavados", lv.error);
  if (todos.error) falla("armario_usos", todos.error);

  const prendas = (pr.data ?? []) as Prenda[];
  const outfits = (of.data ?? []) as Outfit[];
  const usos = (us.data ?? []) as Uso[];
  const lavados = (lv.data ?? []) as Lavado[];

  // Veces que se usó cada outfit (días distintos, hasta hoy).
  const diasOutfit = new Map<string, Set<string>>();
  for (const u of (todos.data ?? []) as { fecha: string; outfit_id: string | null }[]) {
    if (!u.outfit_id) continue;
    if (!diasOutfit.has(u.outfit_id)) diasOutfit.set(u.outfit_id, new Set());
    diasOutfit.get(u.outfit_id)!.add(u.fecha);
  }
  // Lavadas por prenda (días distintos) y último lavado de cada una (la lista viene del más reciente al más viejo).
  const diasLavado = new Map<string, Set<string>>();
  const ultimoLavado = new Map<string, Lavado>();
  for (const l of lavados) {
    for (const g of l.prendas) {
      if (!diasLavado.has(g)) diasLavado.set(g, new Set());
      diasLavado.get(g)!.add(l.fecha);
      if (!ultimoLavado.has(g)) ultimoLavado.set(g, l);
    }
  }

  const usoHoy = usos.find((u) => u.fecha === dia) ?? null;
  // Para decidir qué está disponible en `dia` se excluye lo elegido ese mismo día (así se puede cambiar).
  const fechasSin = new Map<string, string[]>();
  const fechasCon = new Map<string, string[]>();
  for (const u of usos) {
    for (const g of u.prendas) {
      if (!usoCuenta(u, ultimoLavado.get(g))) continue;
      fechasCon.set(g, [...(fechasCon.get(g) ?? []), u.fecha]);
      if (u.fecha !== dia) fechasSin.set(g, [...(fechasSin.get(g) ?? []), u.fecha]);
    }
  }

  const estPrendas: EstadoPrenda[] = prendas.map((p) => {
    const ev = p.activa ? evaluarPrenda(p, fechasSin.get(p.id) ?? [], dia) : { disponible: false, motivo: "fuera (en arreglo o guardada)" };
    const fechas = fechasCon.get(p.id) ?? [];
    return { prenda: p, usos: fechas.length, disponible: ev.disponible, motivo: ev.motivo, fechas, lavadas: diasLavado.get(p.id)?.size ?? 0, vida: vidaLavadas(p.tipo, p.composicion, p.tintoreria) };
  });
  const porId = new Map(estPrendas.map((e) => [e.prenda.id, e]));

  const estOutfits: EstadoOutfit[] = outfits.map((o) => {
    let motivo: string | null = null;
    for (const g of o.prendas) {
      const e = porId.get(g);
      if (!e) {
        motivo = `falta la prenda ${g}`;
        break;
      }
      if (!e.disponible) {
        motivo = `${e.prenda.nombre}: ${e.motivo}`;
        break;
      }
    }
    const dias = [...(diasOutfit.get(o.id) ?? [])].sort();
    return { outfit: o, disponible: motivo === null, motivo, esHoy: usoHoy?.outfit_id === o.id, veces: dias.length, ultimo: dias[dias.length - 1] ?? null };
  });

  const historial = usos.filter((u) => u.fecha >= sumarDias(hoy, -DIAS_ATRAS) && u.fecha <= sumarDias(hoy, DIAS_ADELANTE));
  return { hoy: dia, ultimoLavado: lavados[0]?.fecha ?? null, prendas: estPrendas, outfits: estOutfits, usoHoy, historial, lavados: lavados.slice(0, 12) };
}

/** Día válido para leer o escribir: de 14 días atrás (corregir) a 13 adelante (programar). */
export function diaValido(f: string | null | undefined): string | null {
  const hoy = hoyISO();
  if (!f) return hoy;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return null;
  if (f < sumarDias(hoy, -DIAS_ATRAS) || f > sumarDias(hoy, DIAS_ADELANTE)) return null;
  return f;
}

/** Un outfit por día: si ya había uno, se reemplaza. */
export async function usarOutfit(outfitId: string, dia: string): Promise<void> {
  const est = await estadoArmario(dia);
  const o = est.outfits.find((x) => x.outfit.id === outfitId);
  if (!o) throw new Error("Ese outfit no existe");
  if (!o.disponible) throw new Error(o.motivo ?? "No disponible");
  const del = await db().from("armario_usos").delete().eq("fecha", dia);
  if (del.error) falla("armario_usos", del.error);
  const { error } = await db().from("armario_usos").insert({ fecha: dia, outfit_id: outfitId, prendas: o.outfit.prendas });
  if (error) falla("armario_usos", error);
}

export async function quitarDia(dia: string): Promise<void> {
  const { error } = await db().from("armario_usos").delete().eq("fecha", dia);
  if (error) falla("armario_usos", error);
}

/** Activa o saca una prenda (en arreglo, guardada, regalada). */
export async function activarPrenda(id: string, activa: boolean): Promise<void> {
  const { error } = await db().from("armario_prendas").update({ activa }).eq("id", id);
  if (error) falla("armario_prendas", error);
}

export type AltaPrenda = {
  nombre: string;
  tipo: TipoPrenda;
  color?: string | null;
  tienda?: string | null;
  ref?: string | null;
  talla?: string | null;
  composicion?: string | null;
  cuidado?: string | null;
  tintoreria?: boolean;
  usos_max?: number | null;
  foto?: string | null;
};

export const TIPOS_VALIDOS: TipoPrenda[] = ["top", "capa", "pant", "zapato"];

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function texto(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

/** Valida y normaliza una prenda que llega por API o por el script de carga. */
export function limpiarPrenda(p: unknown): AltaPrenda | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const nombre = texto(o.nombre, 80);
  const tipo = TIPOS_VALIDOS.find((t) => t === o.tipo);
  if (!nombre || !tipo) return null;
  const color = texto(o.color, 7);
  const usos = Number(o.usos_max);
  return {
    nombre,
    tipo,
    color: color && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : null,
    tienda: texto(o.tienda, 40),
    ref: texto(o.ref, 40),
    talla: texto(o.talla, 20),
    composicion: texto(o.composicion, 200),
    cuidado: texto(o.cuidado, 400),
    tintoreria: o.tintoreria === true,
    usos_max: Number.isInteger(usos) && usos >= 1 && usos <= 60 ? usos : null,
    foto: texto(o.foto, 500),
  };
}

/** Da de alta una prenda. Devuelve su id. */
export async function altaPrenda(p: AltaPrenda, idDeseado?: string): Promise<string> {
  const id = idDeseado ? slug(idDeseado) : `${slug(p.nombre) || "prenda"}-${Date.now().toString(36).slice(-4)}`;
  if (!id) throw new Error("id inválido");
  const { count } = await db().from("armario_prendas").select("id", { count: "exact", head: true });
  const { error } = await db().from("armario_prendas").upsert({
    id,
    nombre: p.nombre,
    tipo: p.tipo,
    usos_max: p.usos_max ?? REGLAS_USO[p.tipo].usos,
    color: p.color ?? null,
    tienda: p.tienda ?? null,
    ref: p.ref ?? null,
    talla: p.talla ?? null,
    composicion: p.composicion ?? null,
    cuidado: p.cuidado ?? null,
    tintoreria: p.tintoreria ?? false,
    foto: p.foto ?? null,
    orden: (count ?? 0) + 1,
  });
  if (error) falla("armario_prendas", error);
  return id;
}

/** Crea una combinación. Si no das id, se numera sola (01, 02…). */
export async function altaOutfit(input: { nombre: string; prendas: string[]; ocasion?: string | null; foto?: string | null; collage?: string | null; id?: string }): Promise<string> {
  const nombre = input.nombre.trim().slice(0, 60);
  const prendas = [...new Set(input.prendas.filter((x) => typeof x === "string" && x))].slice(0, 8);
  if (!nombre) throw new Error("Falta el nombre");
  if (prendas.length < 2) throw new Error("Una combinación lleva al menos dos prendas");
  const { data: existentes, error: e1 } = await db().from("armario_prendas").select("id,tipo").in("id", prendas);
  if (e1) falla("armario_prendas", e1);
  if ((existentes ?? []).length !== prendas.length) throw new Error("Alguna prenda no existe");
  let id = input.id ? slug(input.id) : "";
  if (!id) {
    const { data: ids } = await db().from("armario_outfits").select("id").limit(5000);
    const nums = (ids ?? []).map((r) => Number(r.id)).filter((n) => Number.isInteger(n));
    id = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0");
  }
  const { count } = await db().from("armario_outfits").select("id", { count: "exact", head: true });
  const { error } = await db().from("armario_outfits").upsert({ id, nombre, prendas, ocasion: input.ocasion ?? null, foto: input.foto ?? null, collage: input.collage ?? null, activo: true, orden: (count ?? 0) + 1 });
  if (error) falla("armario_outfits", error);
  return id;
}

/** Retira una combinación de la lista (se conserva en el historial). */
export async function retirarOutfit(id: string): Promise<void> {
  const { error } = await db().from("armario_outfits").update({ activo: false }).eq("id", id);
  if (error) falla("armario_outfits", error);
}

/** Registra una carga lavada: esas prendas quedan limpias hasta el último uso de días anteriores. */
export async function lavarCarga(carga: Carga, prendas: string[], dia: string = hoyISO()): Promise<void> {
  if (prendas.length === 0) throw new Error("Carga vacía");
  // Cubre solo los usos de días anteriores: lo puesto hoy y lo programado se conservan.
  const { data } = await db().from("armario_usos").select("id").lt("fecha", dia).order("id", { ascending: false }).limit(1).maybeSingle();
  const hasta = (data as { id: number } | null)?.id ?? 0;
  const { error } = await db().from("armario_lavados").insert({ fecha: dia, carga, prendas, hasta_uso_id: hasta });
  if (error) falla("armario_lavados", error);
}
