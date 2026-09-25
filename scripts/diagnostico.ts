/**
 * Revisa que todo esté listo, sin mostrar ningún valor secreto.
 *   npm run diagnostico
 */
import { createClient } from "@supabase/supabase-js";
import { PASSWORD_MIN } from "../src/lib/auth";

const TABLAS = ["armario_prendas", "armario_outfits", "armario_usos", "armario_lavados", "armario_compras", "armario_enlaces", "armario_mensajes"];

let fallas = 0;
const ok = (m: string) => console.log(`  ✓ ${m}`);
const mal = (m: string) => {
  fallas++;
  console.log(`  ✗ ${m}`);
};
const aviso = (m: string) => console.log(`  · ${m}`);

async function main() {
  console.log("\nVariables de entorno (.env.local)");
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SECRET_KEY ?? "";
  if (/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) ok("SUPABASE_URL");
  else mal("SUPABASE_URL falta o no tiene la forma https://xxxx.supabase.co");
  if (key.startsWith("sb_secret_") || key.split(".").length === 3) ok("SUPABASE_SECRET_KEY");
  else if (key.startsWith("sb_publishable_")) mal("SUPABASE_SECRET_KEY es la llave PUBLICABLE: usa la secreta (sb_secret_…)");
  else mal("SUPABASE_SECRET_KEY falta");
  const pw = (process.env.ARMARIO_PASSWORD ?? "").trim();
  if (pw.length >= PASSWORD_MIN) ok("ARMARIO_PASSWORD");
  else mal(`ARMARIO_PASSWORD falta o tiene menos de ${PASSWORD_MIN} caracteres (el login la rechaza)`);
  if ((process.env.ARMARIO_SESSION_SECRET ?? "").length >= 32) ok("ARMARIO_SESSION_SECRET");
  else mal("ARMARIO_SESSION_SECRET falta o es corto (mínimo 32 caracteres; genera uno con: openssl rand -hex 32)");
  if ((process.env.ARMARIO_API_SECRET ?? "").length >= 32) ok("ARMARIO_API_SECRET (para conectar un bot)");
  else aviso("ARMARIO_API_SECRET no está: solo hace falta si conectas un bot de Telegram u otra app");
  if (process.env.ANTHROPIC_API_KEY) ok("ANTHROPIC_API_KEY (asesora encendida)");
  else aviso("ANTHROPIC_API_KEY no está: la app funciona, la asesora queda apagada");

  if (!url || !key) return;
  console.log("\nBase de datos");
  const db = createClient(url, key, { auth: { persistSession: false } });
  for (const t of TABLAS) {
    const { error, count } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) mal(`${t}: ${error.message.includes("does not exist") || error.code === "42P01" || error.code === "PGRST205" ? "no existe (corre supabase/schema.sql)" : error.message}`);
    else ok(`${t} (${count ?? 0} filas)`);
  }
  const pub = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (pub) {
    const anon = createClient(url, pub, { auth: { persistSession: false } });
    const { data } = await anon.from("armario_prendas").select("id").limit(1);
    if ((data ?? []).length > 0) mal("La llave publicable PUEDE leer tus prendas: revisa que no hayas creado políticas RLS");
    else ok("La llave publicable no puede leer tus datos");
  }
}

main()
  .catch((e: unknown) => mal(e instanceof Error ? e.message : String(e)))
  .finally(() => {
    console.log(fallas === 0 ? "\nTodo listo.\n" : `\n${fallas} cosa(s) por arreglar.\n`);
    process.exit(fallas === 0 ? 0 : 1);
  });
