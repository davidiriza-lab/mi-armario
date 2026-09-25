import { NextResponse } from "next/server";
import { autorizado, mal, noAutorizado } from "@/lib/guard";
import { borrarConversacion, listarMensajes, responder, type ImagenEntrada } from "@/lib/asesora";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** GET: la conversación guardada. */
export async function GET(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  return NextResponse.json({ mensajes: await listarMensajes() });
}

/**
 * POST multipart/form-data: texto, fotos[] (0 a 4, máx 5 MB cada una) → { mensaje: { texto, ... } }.
 * Es el mismo contrato que usa un bot de Telegram con el header x-armario-secret.
 */
export async function POST(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return mal("Se esperaba multipart/form-data");
  }
  const texto = String(form.get("texto") ?? "").trim().slice(0, 4000);
  const fotos = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (fotos.length > 4) return mal("Máximo 4 fotos");
  if (!texto && fotos.length === 0) return mal("Escribe algo o manda una foto");
  const imagenes: ImagenEntrada[] = [];
  for (const f of fotos) {
    if (!TIPOS.has(f.type)) return mal(`Formato no soportado: ${f.type || "desconocido"} (usa JPG, PNG o WebP)`);
    if (f.size > 5 * 1024 * 1024) return mal("Cada foto debe pesar menos de 5 MB");
    imagenes.push({ data: Buffer.from(await f.arrayBuffer()).toString("base64"), media_type: f.type as ImagenEntrada["media_type"] });
  }
  try {
    return NextResponse.json({ mensaje: await responder(texto, imagenes) });
  } catch (e) {
    return mal(e instanceof Error ? e.message : "Error", 500);
  }
}

/** DELETE: empieza la conversación de cero. */
export async function DELETE(req: Request) {
  if (!(await autorizado(req))) return noAutorizado();
  await borrarConversacion();
  return NextResponse.json({ ok: true });
}
