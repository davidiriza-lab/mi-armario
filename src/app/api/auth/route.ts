import { NextResponse } from "next/server";
import { COOKIE, COOKIE_DIAS, passwordOk, tokenSesion } from "@/lib/auth";
import { leerJson } from "@/lib/guard";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await leerJson<{ password?: string }>(req);
  const token = tokenSesion();
  if (!token) return NextResponse.json({ error: "La app no está configurada: faltan ARMARIO_PASSWORD (12+ caracteres) o ARMARIO_SESSION_SECRET (32+)." }, { status: 503 });
  if (!body?.password || body.password.length > 200 || !passwordOk(body.password)) {
    await espera(800); // frena los intentos a ciegas
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * COOKIE_DIAS });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
