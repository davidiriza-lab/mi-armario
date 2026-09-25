/** Tipos y orden de la lista de compras (sin base de datos: se usa también en el navegador). */
import { MONEDA, ORDEN_TIENDAS } from "@/contenido/config";

export type EstadoCompra = "pendiente" | "comprada" | "descartada";

export type Compra = {
  id: number;
  tienda: string;
  nombre: string;
  ref: string | null;
  precio: number | null;
  talla: string | null;
  nota: string | null;
  nivel: number;
  orden: number;
  estado: EstadoCompra;
  comprada_en: string | null;
  url: string | null;
  imagen: string | null;
  color_hex: string | null;
  color_nombre: string | null;
};

const rangoTienda = (t: string) => {
  const i = ORDEN_TIENDAS.indexOf(t);
  return i === -1 ? ORDEN_TIENDAS.length : i;
};

/** Orden de compra: tiendas en tu orden (config), luego nivel (Ahora primero), luego orden manual. */
export function ordenar(items: Compra[]): Compra[] {
  return [...items].sort((a, b) => rangoTienda(a.tienda) - rangoTienda(b.tienda) || a.tienda.localeCompare(b.tienda) || a.nivel - b.nivel || a.orden - b.orden || a.id - b.id);
}

export const precioTexto = (n: number | null) => (n === null ? "" : `${MONEDA.simbolo}${n.toLocaleString(MONEDA.locale)}`);
