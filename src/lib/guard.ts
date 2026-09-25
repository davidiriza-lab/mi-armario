import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, secretoApiOk, tokenValido } from "./auth";

/** Sesión web válida (cookie firmada). */
export async function sesionValida(): Promise<boolean> {
  const jar = await cookies();
  return tokenValido(jar.get(COOKIE)?.value);
}

/** Autoriza una API: sesión web válida O header x-armario-secret. */
export async function autorizado(req: Request): Promise<boolean> {
  if (secretoApiOk(req.headers.get("x-armario-secret"))) return true;
  return sesionValida();
}

export function noAutorizado(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export function mal(msg: string, status = 400): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

export async function leerJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
