import { NextResponse } from "next/server";
import { autorizado, leerJson, mal, noAutorizado } from "@/lib/guard";
import { altaCompra, cambiarEstado, listarCompras, type EstadoCompra } from "@/lib/compras";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  return NextResponse.json({ items: await listarCompras() });
}

const txt = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** POST { tienda, nombre, ... } agrega a la lista. */
export async function POST(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  const b = await leerJson<Record<string, unknown>>(req);
  const tienda = txt(b?.tienda, 40);
  const nombre = txt(b?.nombre, 120);
  if (!b || !tienda || !nombre) return mal("Faltan tienda y nombre");
  const precio = Number(b.precio);
  const hex = txt(b.color_hex, 7);
  const url = txt(b.url, 500);
  await altaCompra({
    tienda,
    nombre,
    ref: txt(b.ref, 40),
    precio: Number.isFinite(precio) && precio > 0 ? precio : null,
    talla: txt(b.talla, 20),
    nota: txt(b.nota, 400),
    nivel: Number(b.nivel) || 2,
    url: url && /^https?:\/\//.test(url) ? url : null,
    color_hex: hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : null,
    color_nombre: txt(b.color_nombre, 40),
  });
  return NextResponse.json({ items: await listarCompras() });
}

/** PATCH { id, estado: pendiente | comprada | descartada } */
export async function PATCH(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  const b = await leerJson<{ id?: number; estado?: EstadoCompra }>(req);
  const id = Number(b?.id);
  if (!Number.isInteger(id) || !b?.estado || !["pendiente", "comprada", "descartada"].includes(b.estado)) return mal("Faltan id y estado válido");
  await cambiarEstado(id, b.estado);
  return NextResponse.json({ ok: true });
}
