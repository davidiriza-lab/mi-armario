import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión sin estado: la cookie guarda HMAC(ARMARIO_SESSION_SECRET, huella de la contraseña).
 * Cambiar la contraseña o el secreto cierra todas las sesiones abiertas.
 * Este archivo no usa next/headers para que también lo pueda importar src/proxy.ts.
 */
export const COOKIE = "armario_sesion";
export const COOKIE_DIAS = 90;
/** Largo mínimo de ARMARIO_PASSWORD. Con menos, el login se rechaza siempre. */
export const PASSWORD_MIN = 12;

function secreto(): string | null {
  const s = process.env.ARMARIO_SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

function password(): string | null {
  const p = (process.env.ARMARIO_PASSWORD ?? "").trim();
  return p.length >= PASSWORD_MIN ? p : null;
}

function iguales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function tokenSesion(): string | null {
  const s = secreto();
  const p = password();
  if (!s || !p) return null;
  const huella = createHash("sha256").update(p).digest("hex");
  return createHmac("sha256", s).update(`armario:${huella}`).digest("hex");
}

export function tokenValido(token: string | undefined | null): boolean {
  const esperado = tokenSesion();
  return !!token && !!esperado && iguales(token, esperado);
}

export function passwordOk(intento: string): boolean {
  const p = password();
  return !!p && iguales(intento.trim(), p);
}

/** Integraciones (un bot de Telegram, scripts): header x-armario-secret. */
export function secretoApiOk(header: string | null): boolean {
  const s = process.env.ARMARIO_API_SECRET ?? "";
  return s.length >= 32 && !!header && iguales(header, s);
}
