/** Pruebas de las reglas de uso entre lavadas (npm run probar). No tocan la base de datos. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cargaDe, evaluarPrenda, type Prenda } from "../src/lib/armario";

const base: Prenda = { id: "x", nombre: "X", tipo: "top", usos_max: 1, color: "#222222", tienda: null, foto: null, activa: true, orden: 0, ref: null, talla: null, composicion: null, cuidado: null, tintoreria: false };
const pant: Prenda = { ...base, tipo: "pant", usos_max: 2 };
const capa: Prenda = { ...base, tipo: "capa", usos_max: 3 };

test("playera: un uso y toca lavar", () => {
  assert.equal(evaluarPrenda(base, [], "2026-09-10").disponible, true);
  assert.equal(evaluarPrenda(base, ["2026-09-08"], "2026-09-10").disponible, false);
});

test("pantalón: dos usos, nunca en días seguidos", () => {
  assert.equal(evaluarPrenda(pant, ["2026-09-08"], "2026-09-10").disponible, true);
  assert.equal(evaluarPrenda(pant, ["2026-09-09"], "2026-09-10").motivo, "la usas el día anterior");
  assert.equal(evaluarPrenda(pant, ["2026-09-11"], "2026-09-10").motivo, "la tienes para el día siguiente");
  assert.equal(evaluarPrenda(pant, ["2026-09-06", "2026-09-08"], "2026-09-10").disponible, false);
});

test("capa: tres usos, máximo dos días seguidos", () => {
  assert.equal(evaluarPrenda(capa, ["2026-09-09"], "2026-09-10").disponible, true);
  assert.equal(evaluarPrenda(capa, ["2026-09-08", "2026-09-09"], "2026-09-10").disponible, false);
  assert.equal(evaluarPrenda(capa, ["2026-09-09", "2026-09-11"], "2026-09-10").disponible, false);
  assert.equal(evaluarPrenda(capa, ["2026-09-11", "2026-09-12"], "2026-09-10").disponible, false);
  assert.equal(evaluarPrenda(capa, ["2026-09-07", "2026-09-12"], "2026-09-10").disponible, true);
});

test("cargas de lavado por color", () => {
  assert.equal(cargaDe({ ...base, color: "#1c1c1c" }), "A");
  assert.equal(cargaDe({ ...base, color: "#ece6d8" }), "B");
  assert.equal(cargaDe({ ...base, color: "#ece6d8", tintoreria: true }), "C");
  assert.equal(cargaDe({ ...base, tipo: "zapato" }), null);
});
