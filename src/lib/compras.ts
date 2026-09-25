import { db } from "./db";
import { NIVELES } from "@/contenido/config";
import { ordenar, precioTexto, type Compra, type EstadoCompra } from "./compras-orden";

export { ordenar, precioTexto, type Compra, type EstadoCompra } from "./compras-orden";

export async function listarCompras(): Promise<Compra[]> {
  const { data, error } = await db().from("armario_compras").select("*").order("id").limit(1000);
  if (error) throw new Error(`armario_compras: ${error.message}`);
  return ordenar((data ?? []).map((c) => ({ ...c, precio: c.precio === null ? null : Number(c.precio) })) as Compra[]);
}

export async function cambiarEstado(id: number, estado: EstadoCompra): Promise<void> {
  const { error } = await db().from("armario_compras").update({ estado, comprada_en: estado === "comprada" ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw new Error(`armario_compras: ${error.message}`);
}

export type AltaCompra = { tienda: string; nombre: string; ref?: string | null; precio?: number | null; talla?: string | null; nota?: string | null; nivel?: number; url?: string | null; imagen?: string | null; color_hex?: string | null; color_nombre?: string | null };

export async function altaCompra(c: AltaCompra): Promise<void> {
  const { error } = await db().from("armario_compras").insert({ ...c, nivel: c.nivel && c.nivel >= 1 && c.nivel <= 3 ? c.nivel : 2 });
  if (error) throw new Error(`armario_compras: ${error.message}`);
}


/** Lo pendiente, en orden de compra, como texto para la asesora. */
export async function textoCompras(): Promise<string> {
  const items = (await listarCompras()).filter((c) => c.estado === "pendiente");
  if (items.length === 0) return "COMPRAS PENDIENTES: ninguna.";
  const lineas: string[] = [];
  let tienda = "";
  for (const c of items) {
    if (c.tienda !== tienda) {
      tienda = c.tienda;
      lineas.push(`— ${tienda} —`);
    }
    const partes = [c.nombre, c.color_nombre ? `color: ${c.color_nombre}` : "", c.ref ? `ref ${c.ref}` : "", precioTexto(c.precio), c.talla ? `talla ${c.talla}` : "", `[${NIVELES[c.nivel] ?? c.nivel}]`, c.nota ?? "", c.url ? `ficha: ${c.url}` : ""].filter(Boolean);
    lineas.push(`· ${partes.join(" · ")}`);
  }
  return ["COMPRAS PENDIENTES (en orden de compra). Lo comprado ya no aparece aquí: consulta el INVENTARIO.", ...lineas].join("\n");
}
