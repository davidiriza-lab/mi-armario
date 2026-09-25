import { NextResponse } from "next/server";
import { autorizado, leerJson, mal, noAutorizado } from "@/lib/guard";
import { crearEnlace, listarEnlaces, revocarEnlace } from "@/lib/enlaces";

export async function GET(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  return NextResponse.json({ enlaces: await listarEnlaces() });
}

export async function POST(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  const b = await leerJson<{ nota?: string }>(req);
  return NextResponse.json({ enlace: await crearEnlace(typeof b?.nota === "string" ? b.nota : undefined) });
}

export async function DELETE(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  const b = await leerJson<{ id?: number }>(req);
  if (!Number.isInteger(b?.id)) return mal("Falta id");
  await revocarEnlace(Number(b?.id));
  return NextResponse.json({ ok: true });
}
