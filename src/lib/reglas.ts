/**
 * Reglas puras (sin base de datos): se usan en el servidor y en el navegador.
 */
import { sumarDias } from "./fecha";
import { REGLAS_USO, type TipoPrenda } from "@/contenido/config";
import { UMBRAL_CLAROS, type Carga } from "@/contenido/lavado";

/** Lo mínimo de una prenda que necesitan las reglas. */
type PrendaRegla = { tipo: TipoPrenda; usos_max: number; color: string | null; tintoreria: boolean };

export function luminosidad(hex: string | null): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Carga de lavado de una prenda: C si es de tintorería, B si es clara, A el resto. Los zapatos no se lavan. */
export function cargaDe(p: PrendaRegla): Carga | null {
  if (p.tipo === "zapato") return null;
  if (p.tintoreria) return "C";
  const l = luminosidad(p.color);
  return l !== null && l > UMBRAL_CLAROS ? "B" : "A";
}

/**
 * ¿Se puede usar esta prenda el día `dia`? Las reglas son simétricas: cuentan los días anteriores
 * y también lo que ya está programado para días siguientes.
 */
export function evaluarPrenda(p: PrendaRegla, fechas: string[], dia: string): { disponible: boolean; motivo: string | null } {
  if (fechas.length >= p.usos_max) return { disponible: false, motivo: `toca lavar (${fechas.length}/${p.usos_max})` };
  const max = REGLAS_USO[p.tipo]?.maxDiasSeguidos ?? null;
  if (max === null) return { disponible: true, motivo: null };
  const f = new Set(fechas);
  let atras = 0;
  while (f.has(sumarDias(dia, -(atras + 1)))) atras++;
  let adelante = 0;
  while (f.has(sumarDias(dia, adelante + 1))) adelante++;
  if (atras + adelante + 1 <= max) return { disponible: true, motivo: null };
  if (max === 1) return { disponible: false, motivo: atras > 0 ? "la usas el día anterior" : "la tienes para el día siguiente" };
  return { disponible: false, motivo: `serían ${atras + adelante + 1} días seguidos` };
}

