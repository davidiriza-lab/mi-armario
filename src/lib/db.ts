import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase SOLO para el servidor (API routes y Server Components).
 * Usa la llave secreta: las tablas tienen RLS activado y ninguna política pública,
 * así que nadie puede leerlas desde el navegador aunque conozca la URL del proyecto.
 * Nunca importes este archivo desde un componente "use client".
 */
let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en las variables de entorno");
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
