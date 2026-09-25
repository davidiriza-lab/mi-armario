import { randomBytes } from "node:crypto";
import { db } from "./db";

export type Enlace = { id: number; token: string; nota: string | null; activo: boolean; usos: number; ultimo_uso: string | null; creado: string };

/** Ligas de solo lectura: abren Vestir sin contraseña y sin poder cambiar nada. */
export async function listarEnlaces(): Promise<Enlace[]> {
  const { data, error } = await db().from("armario_enlaces").select("*").eq("activo", true).order("creado", { ascending: false }).limit(100);
  if (error) throw new Error(`armario_enlaces: ${error.message}`);
  return (data ?? []) as Enlace[];
}

export async function crearEnlace(nota?: string): Promise<Enlace> {
  const token = randomBytes(18).toString("base64url");
  const { data, error } = await db().from("armario_enlaces").insert({ token, nota: nota?.trim().slice(0, 80) || null }).select("*").single();
  if (error) throw new Error(`armario_enlaces: ${error.message}`);
  return data as Enlace;
}

export async function revocarEnlace(id: number): Promise<void> {
  const { error } = await db().from("armario_enlaces").update({ activo: false }).eq("id", id);
  if (error) throw new Error(`armario_enlaces: ${error.message}`);
}

/** Devuelve el enlace si el token es válido y está activo; registra la visita. */
export async function validarToken(token: string | null | undefined): Promise<Enlace | null> {
  if (!token || !/^[A-Za-z0-9_-]{24}$/.test(token)) return null;
  const { data } = await db().from("armario_enlaces").select("*").eq("token", token).eq("activo", true).maybeSingle();
  if (!data) return null;
  const e = data as Enlace;
  await db().from("armario_enlaces").update({ usos: e.usos + 1, ultimo_uso: new Date().toISOString() }).eq("id", e.id);
  return e;
}
