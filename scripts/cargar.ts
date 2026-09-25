/**
 * Carga (o actualiza) prendas, combinaciones y compras desde un JSON.
 *   npm run cargar -- datos/ejemplo.json
 *   npm run cargar -- datos/mi-armario.json
 * Las prendas y combinaciones se identifican por su id: correrlo dos veces actualiza, no duplica.
 * Las compras sí se agregan cada vez (sin id): usa --sin-compras para saltarlas.
 */
import { readFileSync } from "node:fs";
import { altaOutfit, altaPrenda, limpiarPrenda } from "../src/lib/armario";
import { altaCompra, type AltaCompra } from "../src/lib/compras";

type Archivo = { prendas?: unknown[]; outfits?: { id?: string; nombre?: string; prendas?: string[]; ocasion?: string; foto?: string; collage?: string }[]; compras?: AltaCompra[] };

async function main() {
  const ruta = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!ruta) throw new Error("Uso: npm run cargar -- datos/mi-armario.json");
  const datos = JSON.parse(readFileSync(ruta, "utf8")) as Archivo;

  let prendas = 0;
  for (const bruto of datos.prendas ?? []) {
    const p = limpiarPrenda(bruto);
    const id = (bruto as { id?: string }).id;
    if (!p) {
      console.warn("Prenda inválida, se salta:", JSON.stringify(bruto));
      continue;
    }
    await altaPrenda(p, id);
    prendas++;
  }

  let outfits = 0;
  for (const o of datos.outfits ?? []) {
    if (!o.nombre || !Array.isArray(o.prendas)) {
      console.warn("Combinación inválida, se salta:", JSON.stringify(o));
      continue;
    }
    await altaOutfit({ id: o.id, nombre: o.nombre, prendas: o.prendas, ocasion: o.ocasion ?? null, foto: o.foto ?? null, collage: o.collage ?? null });
    outfits++;
  }

  let compras = 0;
  if (!process.argv.includes("--sin-compras")) {
    for (const c of datos.compras ?? []) {
      if (!c.tienda || !c.nombre) continue;
      await altaCompra(c);
      compras++;
    }
  }
  console.log(`Listo: ${prendas} prendas, ${outfits} combinaciones, ${compras} compras.`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
