/**
 * Configuración de tu armario. Todo lo que hace la app "tuya" vive en src/contenido/.
 * Cámbialo a mano o pídeselo a Claude ("cambia la regla de pantalones a tres usos").
 */

export type TipoPrenda = "top" | "capa" | "pant" | "zapato";

/** Nombre que ves en la pantalla de entrada, la pestaña del navegador y el icono al instalarla en el celular. */
export const APP = {
  nombre: "Mi armario",
  /** Cómo te saluda la pantalla de entrada. */
  saludo: "Hola.",
  /** Zona horaria para saber qué es "hoy". Lista: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones */
  zonaHoraria: process.env.ARMARIO_TZ || "America/Mexico_City",
  /** Idioma de fechas ("miércoles 3 de septiembre"). */
  locale: "es-MX",
};

/** Nombres de cada tipo de prenda como los ves en pantalla. */
export const TIPOS: Record<TipoPrenda, string> = {
  top: "Arriba",
  capa: "Capa",
  pant: "Pantalón",
  zapato: "Zapatos",
};

/**
 * Reglas de uso entre lavadas, por tipo de prenda.
 * - usos: cuántas veces te la pones antes de que toque lavarla.
 * - maxDiasSeguidos: cuántos días seguidos se permite la misma prenda (null = sin límite).
 * Ejemplo: pantalón con usos 2 y maxDiasSeguidos 1 = dos puestas por lavada, nunca dos días seguidos.
 * Cada prenda puede tener su propio número de usos en la base (columna usos_max); este valor es el que se usa al darla de alta.
 */
export const REGLAS_USO: Record<TipoPrenda, { usos: number; maxDiasSeguidos: number | null }> = {
  top: { usos: 1, maxDiasSeguidos: null },
  capa: { usos: 3, maxDiasSeguidos: 2 },
  pant: { usos: 2, maxDiasSeguidos: 1 },
  zapato: { usos: 30, maxDiasSeguidos: null },
};

/** Texto corto que se muestra al pie de Vestir. Mantenlo en sintonía con REGLAS_USO. */
export const RESUMEN_REGLAS =
  "Reglas: playeras y camisas, un uso. Pantalones, dos usos y nunca en días seguidos. Capas, tres usos y máximo dos días seguidos. Lo programado para días futuros también cuenta.";

/**
 * Lavadas que aguanta una prenda antes de verse gastada (estimación, no dato de fábrica).
 * La pantalla de Lavado avisa al llegar al 75%. null = no aplica.
 */
export function vidaLavadas(tipo: TipoPrenda, composicion: string | null, tintoreria: boolean): number | null {
  if (tipo === "zapato" || tintoreria) return null;
  if (tipo === "top") return /elastano|spandex/i.test(composicion ?? "") ? 30 : 45;
  if (tipo === "pant") return 80;
  return 60;
}

/** Lista de compras: tiendas en el orden en que prefieres comprar. Las que no estén aquí van al final, en orden alfabético. */
export const ORDEN_TIENDAS: string[] = [];

/** Niveles de prioridad de la lista de compras. */
export const NIVELES: Record<number, string> = { 1: "Ahora", 2: "Después", 3: "Más adelante" };

/** Moneda para mostrar precios en Compras. */
export const MONEDA = { locale: "es-MX", simbolo: "$" };
