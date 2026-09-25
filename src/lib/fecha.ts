import { APP } from "@/contenido/config";

const TZ = APP.zonaHoraria;

/** Fecha ISO (YYYY-MM-DD) de hoy en tu zona horaria. */
export function hoyISO(d: Date = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}

export function sumarDias(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** "miércoles 3 de septiembre" */
export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(APP.locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** "mié 3" */
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(APP.locale, { weekday: "short", day: "numeric", timeZone: "UTC" }).replace(".", "");
}
