import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import { fechaLarga, hoyISO, sumarDias } from "./fecha";
import { DIAS_ADELANTE, estadoArmario, type Prenda } from "./armario";
import { textoCompras } from "./compras";
import { urlFicha } from "./tiendas";
import { TIPOS } from "@/contenido/config";
import { ASESORA, PERSONA, REGLAS } from "@/contenido/asesora";

/**
 * Asesora conversacional de SOLO LECTURA: responde con tu inventario, tus combinaciones,
 * lo que está limpio cada día, tus reglas y tu lista de compras. No modifica nada.
 * Guarda la conversación en armario_mensajes (hilo único, últimos 40 turnos como memoria).
 */

export type Mensaje = { id: number; rol: "user" | "assistant"; texto: string; fotos: number; creado: string };
export type ImagenEntrada = { data: string; media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif" };

function inventarioTexto(prendas: Prenda[]): string {
  const grupos = new Map<string, string[]>();
  for (const p of prendas) {
    const extra = [p.color ? `color ${p.color}` : null, p.tienda, p.ref ? `ref ${p.ref}` : null, p.talla ? `talla ${p.talla}` : null, p.composicion, p.cuidado ? `cuidado: ${p.cuidado}` : null].filter(Boolean).join(", ");
    const linea = `${p.id}: ${p.nombre}${extra ? ` (${extra})` : ""}${p.activa ? "" : " [FUERA]"}`;
    grupos.set(p.tipo, [...(grupos.get(p.tipo) ?? []), linea]);
  }
  return [...grupos.entries()].map(([t, ls]) => `${TIPOS[t as Prenda["tipo"]] ?? t}: ${ls.join("; ")}`).join("\n");
}

async function contexto(): Promise<string> {
  const hoy = hoyISO();
  const est = await estadoArmario(hoy);
  const outfits = est.outfits.map((o) => `${o.outfit.id} ${o.outfit.nombre}: ${o.outfit.prendas.join(" + ")}${o.esHoy ? " [PUESTO HOY]" : o.disponible ? " [disponible hoy]" : ` [no hoy: ${o.motivo}]`}`).join("\n");
  const plan = est.historial.filter((u) => u.fecha > hoy).map((u) => `${u.fecha}: outfit ${u.outfit_id}`).join("; ") || "nada programado";
  return [
    `HOY: ${fechaLarga(hoy)} (${hoy}). Se puede consultar disponibilidad hasta ${sumarDias(hoy, DIAS_ADELANTE)}.`,
    `INVENTARIO (id: nombre; los outfits usan estos ids):\n${inventarioTexto(est.prendas.map((p) => p.prenda)) || "vacío"}`,
    `COMBINACIONES Y DISPONIBILIDAD HOY:\n${outfits || "ninguna todavía"}`,
    `PROGRAMADO: ${plan}. Último lavado registrado: ${est.ultimoLavado ?? "ninguno"}.`,
  ].join("\n\n");
}

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "disponibilidad",
    description: "Qué combinaciones están disponibles en una fecha (YYYY-MM-DD, de hoy a 13 días) según las reglas de lavado y lo ya programado. Úsala antes de recomendar un outfit para un día que no sea hoy.",
    input_schema: { type: "object", properties: { fecha: { type: "string" } }, required: ["fecha"] },
  },
  {
    name: "url_ficha",
    description: "Construye la URL de la ficha oficial de una prenda a partir de la referencia de su etiqueta (Zara '1063/320', Pull&Bear '7720/516'). Luego ábrela con web_fetch.",
    input_schema: { type: "object", properties: { tienda: { type: "string", enum: ["zara", "pullandbear"] }, referencia: { type: "string" } }, required: ["tienda", "referencia"] },
  },
];

async function ejecutarTool(nombre: string, input: Record<string, unknown>): Promise<string> {
  if (nombre === "disponibilidad") {
    const f = String(input.fecha ?? "");
    const hoy = hoyISO();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || f < hoy || f > sumarDias(hoy, DIAS_ADELANTE)) return "Fecha fuera de rango (de hoy a 13 días).";
    const est = await estadoArmario(f);
    return est.outfits.map((o) => `${o.outfit.id} ${o.outfit.nombre}: ${o.esHoy ? "ya programado ese día" : o.disponible ? "disponible" : o.motivo}`).join("\n") || "No hay combinaciones.";
  }
  if (nombre === "url_ficha") return urlFicha(String(input.tienda), String(input.referencia ?? "")) ?? "Referencia inválida (formato 4 dígitos/3 dígitos).";
  return "Herramienta desconocida.";
}

export async function listarMensajes(limit = 200): Promise<Mensaje[]> {
  if (process.env.ARMARIO_DEMO === "1") await (await import("./demo")).asegurarDemoDelDia();
  const { data, error } = await db().from("armario_mensajes").select("id,rol,texto,fotos,creado").order("id", { ascending: false }).limit(limit);
  if (error) throw new Error(`armario_mensajes: ${error.message}`);
  return ((data ?? []) as Mensaje[]).reverse();
}

export async function borrarConversacion(): Promise<void> {
  const { error } = await db().from("armario_mensajes").delete().gt("id", 0);
  if (error) throw new Error(`armario_mensajes: ${error.message}`);
}

/** Responde un mensaje (texto y hasta 4 fotos). Guarda ambos turnos. */
export async function responder(texto: string, imagenes: ImagenEntrada[]): Promise<Mensaje> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY: la asesora está apagada.");
  const client = new Anthropic();
  const [historial, armario, compras] = await Promise.all([listarMensajes(40), contexto(), textoCompras()]);
  const system = [PERSONA, REGLAS, compras, armario].join("\n\n");

  const messages: Anthropic.Beta.BetaMessageParam[] = historial.map((m) => ({ role: m.rol, content: m.fotos && m.rol === "user" ? `${m.texto}\n[adjuntó ${m.fotos} foto(s) en su momento]` : m.texto }));
  messages.push({
    role: "user",
    content: [
      ...imagenes.map((im) => ({ type: "image" as const, source: { type: "base64" as const, media_type: im.media_type, data: im.data } })),
      { type: "text" as const, text: texto || "(foto sin texto)" },
    ],
  });

  const tools: Anthropic.Beta.BetaToolUnion[] = [...TOOLS, { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 }];
  // Si el modelo declina por sus filtros de seguridad, la API reintenta sola con el modelo de respaldo recomendado.
  const conRespaldo = /^claude-(opus-5|fable-5)/.test(ASESORA.modelo);

  let respuesta = "";
  for (let vuelta = 0; vuelta < 8; vuelta++) {
    const r = await client.beta.messages.create({
      model: ASESORA.modelo,
      max_tokens: 4000,
      output_config: { effort: ASESORA.esfuerzo },
      system,
      tools,
      messages,
      ...(conRespaldo ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    if (r.stop_reason === "refusal") {
      respuesta = "No puedo ayudar con eso. Prueba a preguntarlo de otra forma.";
      break;
    }
    respuesta = r.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    // pause_turn: una herramienta del servidor (web_fetch) quedó a medias; se reenvía para que continúe.
    if (r.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: r.content });
      continue;
    }
    if (r.stop_reason !== "tool_use") break;
    const usos = r.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    messages.push({ role: "assistant", content: r.content });
    const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
      usos.map(async (u) => {
        try {
          return { type: "tool_result" as const, tool_use_id: u.id, content: await ejecutarTool(u.name, (u.input ?? {}) as Record<string, unknown>) };
        } catch (e) {
          return { type: "tool_result" as const, tool_use_id: u.id, content: `Error: ${e instanceof Error ? e.message : "desconocido"}`, is_error: true };
        }
      }),
    );
    messages.push({ role: "user", content: resultados });
  }
  if (!respuesta) respuesta = "No pude armar una respuesta. Inténtalo de nuevo.";

  const u = await db().from("armario_mensajes").insert({ rol: "user", texto: texto || "(foto)", fotos: imagenes.length });
  if (u.error) throw new Error(`armario_mensajes: ${u.error.message}`);
  const { data, error } = await db().from("armario_mensajes").insert({ rol: "assistant", texto: respuesta, fotos: 0 }).select("id,rol,texto,fotos,creado").single();
  if (error) throw new Error(`armario_mensajes: ${error.message}`);
  return data as Mensaje;
}
